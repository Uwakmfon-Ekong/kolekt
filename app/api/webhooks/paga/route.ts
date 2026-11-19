import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { one, q } from "@/lib/server/db";
import { verifyCallback, type PagaCallback } from "@/lib/server/paga";
import { markPendingAs, settleTransaction } from "@/lib/server/payments";

/**
 * Paga payment-request callback.
 * 1. Authenticate the SHA-512 hash (reject forgeries).
 * 2. De-duplicate on notificationId (Paga retries up to 3x with the same id).
 * 3. Re-verify against Paga's ledger before counting any money.
 * Paga expects HTTP 200 + {"status":"SUCCESS"} to stop retrying.
 */
const ACK = () => NextResponse.json({ status: "SUCCESS" });
const FINAL = new Set(["verified", "ignored", "unknown_reference"]);

export async function POST(req: Request) {
  const raw = await req.text();
  let payload: PagaCallback;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ status: "FAILED", error: "invalid json" }, { status: 400 });
  }

  const hashValid = verifyCallback(payload, req.headers);
  const reference = payload.externalReferenceNumber?.toString().trim();
  const tx = reference ? await one<{ id: string }>("select id from transactions where reference = $1", [reference]) : null;

  if (!hashValid) {
    // Log forgeries under their own key so they can never "claim" a genuine notificationId.
    const bodyKey = "rejected:" + createHash("sha256").update(raw).digest("hex");
    await q(
      `insert into payment_events (transaction_id, provider_event_reference, event_type, hash_valid, verification_status, payload)
       values ($1,$2,$3,false,'rejected_hash',$4) on conflict (provider_event_reference) do nothing`,
      [tx?.id ?? null, bodyKey, payload.event ?? null, raw],
    );
    console.warn("[paga-webhook] rejected: bad hash", reference);
    return NextResponse.json({ status: "FAILED", error: "invalid hash" }, { status: 401 });
  }

  const eventRef =
    payload.notificationId ??
    (payload.transactionReference as string | undefined) ??
    "body:" + createHash("sha256").update(raw).digest("hex");

  const inserted = await one<{ id: string }>(
    `insert into payment_events (transaction_id, provider_event_reference, event_type, hash_valid, verification_status, payload)
     values ($1,$2,$3,true,'received',$4)
     on conflict (provider_event_reference) do nothing
     returning id`,
    [tx?.id ?? null, eventRef, payload.event ?? null, raw],
  );

  if (!inserted) {
    // Paga retry of a notification we've already seen. If it was fully handled, just acknowledge.
    const prev = await one<{ verification_status: string }>(
      "select verification_status from payment_events where provider_event_reference = $1",
      [eventRef],
    );
    if (prev && FINAL.has(prev.verification_status)) return ACK();
  }

  const setStatus = (s: string) =>
    q("update payment_events set verification_status = $2 where provider_event_reference = $1", [eventRef, s]);

  if (!reference || !tx) {
    await setStatus("unknown_reference");
    return ACK();
  }

  switch (payload.event) {
    case "PAYMENT_COMPLETE":
    case "PARTIAL_PAYMENT": {
      const result = await settleTransaction(reference, {
        providerReference: payload.fundingPaymentReference ?? payload.fundingDetails?.paymentReferenceNumber,
        paymentMethod: "BANK_TRANSFER",
        signedCallback: payload.event === "PAYMENT_COMPLETE",
      });
      if (result.outcome === "settled" || result.outcome === "already_final") {
        await setStatus("verified");
        return ACK();
      }
      // Hash was valid but the ledger doesn't show the money yet. Ask Paga to retry;
      // the checkout page's status poll will also keep re-checking.
      await setStatus("ledger_pending");
      return NextResponse.json({ status: "RETRY" }, { status: 503 });
    }
    case "PAYMENT_REQUEST_EXPIRED":
      await markPendingAs(reference, "expired");
      await setStatus("verified");
      return ACK();
    case "PAYMENT_ERROR":
      await markPendingAs(reference, "failed");
      await setStatus("verified");
      return ACK();
    default:
      await setStatus("ignored");
      return ACK();
  }
}
