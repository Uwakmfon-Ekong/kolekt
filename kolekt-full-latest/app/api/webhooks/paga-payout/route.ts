import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { one, q } from "@/lib/server/db";
import { verifyPayoutCallback } from "@/lib/server/paga-business";

/**
 * Paga Business API deposit-to-bank notification. Updates a payout's final status.
 * Authenticated with x-paga-hash; anything unsigned is rejected.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ status: "FAILED", error: "invalid json" }, { status: 400 });
  }
  const valid = verifyPayoutCallback(payload, req.headers);
  const reference = String(payload.referenceNumber ?? "");
  const eventKey = "payout:" + (req.headers.get("x-paga-request-id") ?? createHash("sha256").update(raw).digest("hex"));

  await q(
    `insert into payment_events (provider_event_reference, event_type, hash_valid, verification_status, payload)
     values ($1,'DEPOSIT_TO_BANK',$2,$3,$4) on conflict (provider_event_reference) do nothing`,
    [valid ? eventKey : "rejected:" + eventKey, valid, valid ? "received" : "rejected_hash", raw],
  );
  if (!valid) return NextResponse.json({ status: "FAILED", error: "invalid hash" }, { status: 401 });

  const payout = await one<{ id: string }>("select id from payouts where reference = $1", [reference]);
  if (!payout) return NextResponse.json({ status: "SUCCESS" });

  const succeeded = Number(payload.responseCode) === 0 && !payload.reversalId;
  await q(
    `update payouts set status = $2, provider_transaction_id = coalesce($3, provider_transaction_id),
            fee = coalesce($4, fee), message = $5, updated_at = now()
      where id = $1 and status <> 'successful'`,
    [payout.id, succeeded ? "successful" : "failed", (payload.transactionId as string) ?? null, payload.fee != null ? Number(payload.fee) : null, String(payload.message ?? "")],
  );
  return NextResponse.json({ status: "SUCCESS" });
}
