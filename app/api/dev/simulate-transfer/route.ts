import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { one, q } from "@/lib/server/db";
import { buildMockCallback, pagaMode } from "@/lib/server/paga";

/**
 * DEMO MODE ONLY. Pretends a contributor just made the bank transfer:
 * writes to the mock ledger, then POSTs a hash-signed callback to our own
 * webhook, the exact same path a real Paga notification takes.
 * (With sandbox keys, use Paga's Bank Transfer Simulator instead.)
 */
export async function POST(req: Request) {
  if (pagaMode() !== "mock") {
    return NextResponse.json({ error: "Simulator is only available in mock mode." }, { status: 403 });
  }
  const { reference, sendTwice } = (await req.json().catch(() => ({}))) as { reference?: string; sendTwice?: boolean };
  const t = reference
    ? await one<{ amount: number; amount_to_pay: number | null; status: string }>(
        "select amount, amount_to_pay, status from transactions where reference = $1",
        [reference],
      )
    : null;
  if (!t) return NextResponse.json({ error: "Unknown reference" }, { status: 404 });
  if (t.status !== "pending") return NextResponse.json({ error: `Transaction is already ${t.status}` }, { status: 409 });

  const amount = Number(t.amount_to_pay ?? t.amount);
  await q("insert into mock_paga_payments (reference, amount) values ($1,$2)", [reference, amount]);

  const payload = buildMockCallback(reference!, amount, randomUUID());
  const webhook = new URL("/api/webhooks/paga", req.url).toString();
  const deliveries = sendTwice ? 2 : 1;
  const results: number[] = [];
  for (let i = 0; i < deliveries; i++) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    results.push(res.status);
  }
  return NextResponse.json({ ok: true, webhookStatuses: results });
}
