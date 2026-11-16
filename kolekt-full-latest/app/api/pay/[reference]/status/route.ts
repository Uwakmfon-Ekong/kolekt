import { NextResponse } from "next/server";
import { one } from "@/lib/server/db";
import { settleTransaction } from "@/lib/server/payments";

type G = typeof globalThis & { __kolektLastCheck?: Map<string, number> };
const lastCheck = ((globalThis as G).__kolektLastCheck ??= new Map());

/**
 * Polled by the checkout page every few seconds. Normally the webhook settles the
 * payment first; if a webhook is lost, this re-checks Paga's ledger (throttled)
 * so the payer is never stuck on "waiting".
 */
export async function GET(_req: Request, ctx: { params: Promise<{ reference: string }> }) {
  const { reference } = await ctx.params;
  let t = await one<{ status: string; created_at: string }>(
    "select status, created_at from transactions where reference = $1",
    [reference],
  );
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (t.status === "pending") {
    const age = Date.now() - new Date(t.created_at).getTime();
    const since = Date.now() - (lastCheck.get(reference) ?? 0);
    if (age > 15_000 && since > 12_000) {
      lastCheck.set(reference, Date.now());
      try {
        await settleTransaction(reference);
      } catch (e) {
        console.error("[status] reconcile failed", reference, e);
      }
      t = (await one<{ status: string; created_at: string }>(
        "select status, created_at from transactions where reference = $1",
        [reference],
      ))!;
    }
  }
  return NextResponse.json({ status: t.status }, { headers: { "Cache-Control": "no-store" } });
}
