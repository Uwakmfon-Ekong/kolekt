"use server";

import { revalidatePath } from "next/cache";
import { one, q } from "@/lib/server/db";
import { requireOrganiser, verifyPassword } from "@/lib/server/auth";
import { appUrl } from "@/lib/server/app-url";
import { getBanks, validateAccount, type Bank } from "@/lib/server/paga-business";
import { PayoutError, refreshPayout, requestPayout, type Payout } from "@/lib/server/payouts";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function listBanksAction(): Promise<Result<Bank[]>> {
  await requireOrganiser();
  try {
    return { ok: true, data: await getBanks() };
  } catch (e) {
    console.error("[payout] getBanks failed", e);
    return { ok: false, error: "We couldn’t load the list of banks. Please try again." };
  }
}

async function bankByUuid(uuid: string) {
  return (await getBanks()).find((b) => b.uuid === uuid) ?? null;
}

/** Step 1: look up the account name with Paga, so the organiser can confirm it's theirs. */
export async function verifyAccountAction(bankUUID: string, accountNumber: string): Promise<Result<{ accountName: string; bankName: string }>> {
  const me = await requireOrganiser();
  try {
    const bank = await bankByUuid(String(bankUUID));
    if (!bank) return { ok: false, error: "Choose your bank." };
    const r = await validateAccount({ bankUUID: bank.uuid, accountNumber: String(accountNumber).trim(), amount: 1000, fallbackName: me.full_name });
    if (!r.ok) return { ok: false, error: r.error };
    return { ok: true, data: { accountName: r.accountName, bankName: bank.name } };
  } catch (e) {
    console.error("[payout] validate failed", e);
    return { ok: false, error: "We couldn’t reach Paga to check that account. Please try again." };
  }
}

/**
 * Step 2: save it. The password is asked again so a stolen session can't redirect payouts,
 * and the account is re-verified with Paga on the server (the browser's word isn't trusted).
 */
export async function savePayoutAccountAction(input: { bankUUID: string; accountNumber: string; password: string }): Promise<Result<{ accountName: string }>> {
  const me = await requireOrganiser();
  const row = await one<{ password_hash: string }>("select password_hash from organisers where id = $1", [me.id]);
  if (!row || !(await verifyPassword(String(input.password ?? ""), row.password_hash))) {
    return { ok: false, error: "That password isn’t right." };
  }
  const check = await verifyAccountAction(input.bankUUID, input.accountNumber);
  if (!check.ok) return check;
  await q(
    `update organisers set payout_bank_uuid = $2, payout_bank_name = $3, payout_account_number = $4, payout_account_name = $5 where id = $1`,
    [me.id, input.bankUUID, check.data.bankName, String(input.accountNumber).trim(), check.data.accountName],
  );
  revalidatePath("/", "layout");
  return { ok: true, data: { accountName: check.data.accountName } };
}

export async function withdrawAction(collectionId: string, amount: number): Promise<Result<Payout>> {
  const me = await requireOrganiser();
  try {
    const payout = await requestPayout({ organiserId: me.id, collectionId: String(collectionId), amount: Number(amount), appUrl: await appUrl() });
    revalidatePath("/", "layout");
    if (payout.status === "failed") return { ok: false, error: `Paga couldn’t complete the payout: ${payout.message ?? "unknown error"}. No money left your balance.` };
    return { ok: true, data: payout };
  } catch (e) {
    if (e instanceof PayoutError) return { ok: false, error: e.message };
    console.error("[payout] withdraw failed", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function refreshPayoutAction(reference: string): Promise<Result<Payout>> {
  const me = await requireOrganiser();
  const p = await refreshPayout(me.id, String(reference));
  if (!p) return { ok: false, error: "Payout not found." };
  revalidatePath("/", "layout");
  return { ok: true, data: p };
}
