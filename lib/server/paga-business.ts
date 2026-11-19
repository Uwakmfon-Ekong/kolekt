import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Paga Business REST API client: sending money OUT (payouts to organisers).
 * Docs: https://developer-docs.paga.com/docs/business-rest-api-operations
 *
 * The Collect API (lib/server/paga.ts) receives contributions; this one verifies
 * bank accounts and pays collected money into them.
 *
 * Modes:
 *  - mock    : no PAGA_BUSINESS_* keys. Realistic fake responses for demos.
 *  - sandbox : keys set, PAGA_ENV=sandbox (default) -> beta.mypaga.com
 *  - live    : PAGA_ENV=live -> www.mypaga.com
 *
 * Auth: headers `principal` (public ID), `credentials` (password) and `hash`:
 * SHA-512 of the operation's listed fields, in order, followed by the hash key.
 */

export type BusinessMode = "mock" | "sandbox" | "live";

const BASE = {
  sandbox: "https://beta.mypaga.com/paga-webservices/business-rest/secured/",
  live: "https://www.mypaga.com/paga-webservices/business-rest/secured/",
};

/** Paga's own public ID, usable as a bank UUID to pay into a Paga account. */
const PAGA_BANK_UUID = "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA";

export function businessMode(): BusinessMode {
  const { PAGA_BUSINESS_PUBLIC_KEY, PAGA_BUSINESS_PASSWORD, PAGA_BUSINESS_HASH_KEY, PAGA_ENV } = process.env;
  if (!PAGA_BUSINESS_PUBLIC_KEY || !PAGA_BUSINESS_PASSWORD || !PAGA_BUSINESS_HASH_KEY) return "mock";
  return PAGA_ENV === "live" ? "live" : "sandbox";
}

const sha512 = (s: string) => createHash("sha512").update(s, "utf8").digest("hex");
const hashOf = (parts: (string | number)[]) => sha512(parts.map(String).join("") + (process.env.PAGA_BUSINESS_HASH_KEY ?? "kolekt-mock-business-key"));
const ref = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1e6).toString().padStart(6, "0")}`;
/** Amounts are sent as "5000.00", and the hash uses exactly the same string. */
export const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

type BaseResponse = { responseCode: number | string; message?: string; referenceNumber?: string };

async function call<T extends BaseResponse>(method: string, body: Record<string, unknown>, hashParts: (string | number)[]): Promise<T> {
  const mode = businessMode();
  if (mode === "mock") throw new Error("call() is not used in mock mode");
  const res = await fetch(BASE[mode] + method, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      principal: process.env.PAGA_BUSINESS_PUBLIC_KEY!,
      credentials: process.env.PAGA_BUSINESS_PASSWORD!,
      hash: hashOf(hashParts),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Paga ${method} returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
}

const ok = (r: BaseResponse) => Number(r.responseCode) === 0;

/* ------------------------------------------------------------------ */
/* Banks                                                               */
/* ------------------------------------------------------------------ */

export type Bank = { name: string; uuid: string };

const DEMO_BANKS: Bank[] = [
  "Access Bank", "Ecobank", "Fidelity Bank", "First Bank", "FCMB", "GTBank", "Keystone Bank", "Kuda",
  "Moniepoint", "OPay", "Paga", "PalmPay", "Polaris Bank", "Stanbic IBTC", "Sterling Bank", "UBA",
  "Union Bank", "Wema Bank", "Zenith Bank",
].map((name, i) => ({ name, uuid: name === "Paga" ? PAGA_BANK_UUID : `DEMO0000-0000-4000-8000-${String(i + 1).padStart(12, "0")}` }));

type G = typeof globalThis & { __kolektBanks?: { at: number; banks: Bank[] } };
const g = globalThis as G;

export async function getBanks(): Promise<Bank[]> {
  if (businessMode() === "mock") return DEMO_BANKS;
  if (g.__kolektBanks && Date.now() - g.__kolektBanks.at < 6 * 3600e3) return g.__kolektBanks.banks;
  const referenceNumber = ref("KB");
  const r = await call<BaseResponse & { banks?: Bank[]; bank?: Bank[] }>("getBanks", { referenceNumber }, [referenceNumber]);
  if (!ok(r)) throw new Error(`getBanks ${r.responseCode}: ${r.message}`);
  const banks = (r.banks ?? r.bank ?? [])
    .map((b) => ({ name: String(b.name), uuid: String(b.uuid) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  g.__kolektBanks = { at: Date.now(), banks };
  return banks;
}

/* ------------------------------------------------------------------ */
/* Account name lookup                                                 */
/* ------------------------------------------------------------------ */

export type AccountCheck = { ok: true; accountName: string; fee: number } | { ok: false; error: string };

/** Ask Paga whose account this is before we ever send money to it. */
export async function validateAccount(input: { bankUUID: string; accountNumber: string; amount: number; fallbackName: string }): Promise<AccountCheck> {
  if (!/^\d{10}$/.test(input.accountNumber)) return { ok: false, error: "Account numbers have 10 digits." };
  if (businessMode() === "mock") {
    // Demo: any 10-digit number "belongs" to the organiser, except 0000000000.
    if (/^0+$/.test(input.accountNumber)) return { ok: false, error: "We couldn’t find that account. Check the number and bank." };
    return { ok: true, accountName: input.fallbackName.toUpperCase(), fee: 0 };
  }
  const referenceNumber = ref("KV");
  const amount = money(input.amount);
  const r = await call<BaseResponse & { destinationAccountHolderNameAtBank?: string; fee?: number }>(
    "validateDepositToBank",
    { referenceNumber, amount, currency: "NGN", destinationBankUUID: input.bankUUID, destinationBankAccountNumber: input.accountNumber },
    [referenceNumber, amount, input.bankUUID, input.accountNumber],
  );
  if (!ok(r) || !r.destinationAccountHolderNameAtBank) {
    return { ok: false, error: r.message || "We couldn’t verify that account. Check the number and bank." };
  }
  return { ok: true, accountName: r.destinationAccountHolderNameAtBank, fee: Number(r.fee ?? 0) };
}

/* ------------------------------------------------------------------ */
/* Payout                                                              */
/* ------------------------------------------------------------------ */

export type DepositResult =
  | { status: "successful" | "processing"; transactionId: string | null; fee: number; message: string }
  | { status: "failed"; message: string };

export async function depositToBank(input: {
  reference: string;
  amount: number;
  bankUUID: string;
  accountNumber: string;
  recipientName: string;
  remarks: string;
  callbackUrl: string;
}): Promise<DepositResult> {
  if (businessMode() === "mock") {
    return { status: "successful", transactionId: `DEMO-${input.reference.slice(-8)}`, fee: 0, message: "Demo payout: no real money moved." };
  }
  const amount = money(input.amount);
  const r = await call<BaseResponse & { transactionId?: string; fee?: number }>(
    "depositToBank",
    {
      referenceNumber: input.reference,
      amount,
      currency: "NGN",
      destinationBankUUID: input.bankUUID,
      destinationBankAccountNumber: input.accountNumber,
      recipientName: input.recipientName.slice(0, 60),
      remarks: input.remarks.slice(0, 60),
      suppressRecipientMessage: true,
      statusCallbackUrl: input.callbackUrl,
    },
    [input.reference, amount, input.bankUUID, input.accountNumber],
  );
  if (!ok(r)) return { status: "failed", message: r.message || `Paga responseCode ${r.responseCode}` };
  return { status: "successful", transactionId: r.transactionId ?? null, fee: Number(r.fee ?? 0), message: r.message ?? "Paid" };
}

/** Re-check a payout whose result we're unsure of. */
export async function operationStatus(reference: string): Promise<"successful" | "failed" | "processing"> {
  if (businessMode() === "mock") return "successful";
  const r = await call<BaseResponse & { transactionStatus?: string }>("getOperationStatus", { referenceNumber: reference }, [reference]);
  const s = String(r.transactionStatus ?? "").toUpperCase();
  if (s === "SUCCESSFUL") return "successful";
  if (s === "FAILED" || s === "REVERSED") return "failed";
  return "processing";
}

/**
 * Deposit-to-bank notification: x-paga-hash = SHA-512 of the fields named in
 * x-paga-hash-parameters (referenceNumber, transactionDate, transactionId, amount, sessionId) + hashKey.
 */
export function verifyPayoutCallback(payload: Record<string, unknown>, headers: Headers): boolean {
  const given = headers.get("x-paga-hash");
  const params = headers.get("x-paga-hash-parameters") ?? "referenceNumber,transactionDate,transactionId,amount,sessionId,hashKey";
  if (!given) return false;
  const fields = params.split(",").map((f) => f.trim()).filter((f) => f && f !== "hashKey");
  const expected = Buffer.from(hashOf(fields.map((f) => String(payload[f] ?? ""))).toLowerCase());
  const actual = Buffer.from(given.toLowerCase());
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Setup check: getBanks with the Business API keys (fails with an IP or credentials error if not whitelisted). */
export async function businessPing(): Promise<{ mode: BusinessMode; ok: boolean; detail: string }> {
  const mode = businessMode();
  if (mode === "mock") return { mode, ok: false, detail: "No Business API keys set (PAGA_BUSINESS_PUBLIC_KEY, PAGA_BUSINESS_PASSWORD, PAGA_BUSINESS_HASH_KEY), so payouts and refunds are in demo mode." };
  const referenceNumber = ref("KC");
  try {
    const r = await call<BaseResponse & { banks?: unknown[] }>("getBanks", { referenceNumber }, [referenceNumber]);
    return ok(r)
      ? { mode, ok: true, detail: `Connected to Paga Business API (${(r.banks ?? []).length} banks returned).` }
      : { mode, ok: false, detail: `Paga replied ${r.responseCode}: ${r.message ?? "no message"}` };
  } catch (e) {
    return { mode, ok: false, detail: String((e as Error).message).slice(0, 300) };
  }
}
