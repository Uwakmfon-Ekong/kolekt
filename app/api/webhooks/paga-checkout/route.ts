import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { q } from "@/lib/server/db";

/**
 * Paga Checkout payment notification.
 * Docs: https://developer-docs.paga.com/reference/checkout-checkoutnotification
 * Signature: SHA-512(amount + timeStamp + paymentReference + hashKey), lowercase hex, in the body's `hash`.
 * For now this only records verified notifications; payments are confirmed with verifyCheckout().
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

  const key = `checkout:${valid ? "" : "rejected:"}${createHash("sha256").update(raw).digest("hex")}`;
  await q(
    `insert into payment_events (provider_event_reference, event_type, hash_valid, verification_status, payload)
     values ($1,'CHECKOUT_NOTIFICATION',$2,$3,$4) on conflict (provider_event_reference) do nothing`,
    [key, valid, valid ? "received" : "rejected_hash", raw],
  );
  console.log("[paga-checkout] notification", { reference: p.paymentReference, statusCode: p.statusCode, amount: p.amount, hashValid: valid });
  if (!valid) return NextResponse.json({ status: "FAILED", error: "invalid hash" }, { status: 401 });
  return NextResponse.json({ status: "SUCCESS" });
}
