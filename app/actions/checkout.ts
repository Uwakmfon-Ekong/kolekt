"use server";

import { appUrl } from "@/lib/server/app-url";
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
