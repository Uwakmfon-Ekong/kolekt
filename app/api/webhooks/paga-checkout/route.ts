import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { one, q } from "@/lib/server/db";
import { settleTransaction } from "@/lib/server/payments";

/**
 * Paga Checkout payment notification.
 * Docs: https://developer-docs.paga.com/reference/checkout-checkoutnotification
 * Signature: SHA-512(amount + timeStamp + paymentReference + hashKey), lowercase hex, in the body's `hash`.
 *
 * A valid notification only triggers settlement; settleTransaction() still confirms the payment
 * with Checkout's verify endpoint (and the amount) before it counts. Repeats are counted once.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  let p: Record<string, unknown>;
  try {
    p = JSON.parse(raw);
  } catch {
    return NextResponse.json({ status: "FAILED", error: "invalid json" }, { status: 400 });
  }
  const expected = createHash("sha512")
    .update(`${p.amount ?? ""}${p.timeStamp ?? ""}${p.paymentReference ?? ""}${process.env.PAGA_HASH_KEY ?? ""}`)
    .digest("hex");
  const given = Buffer.from(String(p.hash ?? "").toLowerCase());
  const valid = given.length === expected.length && timingSafeEqual(given, Buffer.from(expected));

  const reference = String(p.paymentReference ?? "").trim();
  const tx = reference ? await one<{ id: string }>("select id from transactions where reference = $1", [reference]) : null;
  const key = `checkout:${valid ? "" : "rejected:"}${createHash("sha256").update(raw).digest("hex")}`;
  await q(
    `insert into payment_events (transaction_id, provider_event_reference, event_type, hash_valid, verification_status, payload)
     values ($1,$2,'CHECKOUT_NOTIFICATION',$3,$4,$5) on conflict (provider_event_reference) do nothing`,
    [tx?.id ?? null, key, valid, valid ? "received" : "rejected_hash", raw],
  );
  if (!valid) {
    console.warn("[paga-checkout] rejected: bad hash", reference);
    return NextResponse.json({ status: "FAILED", error: "invalid hash" }, { status: 401 });
  }
  const setStatus = (s: string) => q("update payment_events set verification_status = $2 where provider_event_reference = $1", [key, s]);

  if (!tx) {
    await setStatus("unknown_reference");
    return NextResponse.json({ status: "SUCCESS" });
  }
  if (String(p.statusCode) !== "0") {
    await setStatus("ignored");
    return NextResponse.json({ status: "SUCCESS" });
  }

  const result = await settleTransaction(reference, { paymentMethod: "PAGA_CHECKOUT", signedCallback: true });
  if (result.outcome === "settled" || result.outcome === "already_final") {
    await setStatus("verified");
    return NextResponse.json({ status: "SUCCESS" });
  }
  // Signed, but Paga's verify doesn't show the money yet: ask Paga to retry. The pay page keeps checking too.
  await setStatus("ledger_pending");
  return NextResponse.json({ status: "RETRY" }, { status: 503 });
}
