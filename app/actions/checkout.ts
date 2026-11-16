"use server";

import { headers } from "next/headers";
import { appUrl } from "@/lib/server/app-url";
import { checkPayment } from "@/lib/server/check-payment";
import type { PaymentCheck } from "@/lib/data";
import { startContribution, UserError } from "@/lib/server/payments";

export type CheckoutResult = { ok: true; reference: string } | { ok: false; error: string };

/** Public: anyone with the link can start a contribution. No organiser session involved. */
export async function startContributionAction(input: { slug: string; values: Record<string, string>; amount?: number }): Promise<CheckoutResult> {
  try {
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(input.values ?? {}).slice(0, 20)) values[String(k).slice(0, 40)] = String(v ?? "");
    const { reference } = await startContribution({ slug: String(input.slug), values, amount: input.amount, appUrl: await appUrl() });
    return { ok: true, reference };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    console.error("[checkout] failed", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

// Up to 20 lookups per 10 minutes per visitor, so nobody can run through a whole class list.
const lookups = new Map<string, { n: number; since: number }>();

/** Public: "Check my payment" on a collection's page. */
export async function checkPaymentAction(slug: string, identifier: string): Promise<{ ok: true; data: PaymentCheck } | { ok: false; error: string }> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local").split(",")[0].trim();
  const now = Date.now();
  const r = lookups.get(ip);
  if (r && now - r.since < 10 * 60e3) {
    if (r.n >= 20) return { ok: false, error: "Too many checks. Please wait a few minutes and try again." };
    r.n++;
  } else lookups.set(ip, { n: 1, since: now });
  if (lookups.size > 5000) lookups.clear();
  try {
    return { ok: true, data: await checkPayment(String(slug), String(identifier ?? "")) };
  } catch (e) {
    console.error("[check] failed", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
