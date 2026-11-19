import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { q } from "./db";

/**
 * Paga Collect API client.
 * Docs: https://developer-docs.paga.com/docs/paga-collect-api
 *
 * Modes:
 *  - mock    : no keys set. Kolekt fakes Paga's responses AND signs its own
 *              callbacks with the hash key, so the real webhook + verification
 *              path is exercised end to end. Perfect for demos.
 *  - sandbox : PAGA_* keys set, PAGA_ENV=sandbox (default) -> beta-collect.paga.com
 *  - live    : PAGA_ENV=live -> collect.paga.com
 */

export type PagaMode = "mock" | "sandbox" | "live";

const BASE = {
  sandbox: "https://beta-collect.paga.com/",
  live: "https://collect.paga.com/",
};

const MOCK_HASH_KEY = "kolekt-mock-hash-key";

export function pagaMode(): PagaMode {
  const { PAGA_PUBLIC_KEY, PAGA_SECRET_KEY, PAGA_HASH_KEY, PAGA_ENV } = process.env;
  if (!PAGA_PUBLIC_KEY || !PAGA_SECRET_KEY || !PAGA_HASH_KEY) return "mock";
  return PAGA_ENV === "live" ? "live" : "sandbox";
}

function hashKey() {
  return pagaMode() === "mock" ? process.env.PAGA_HASH_KEY || MOCK_HASH_KEY : process.env.PAGA_HASH_KEY!;
}

export const sha512 = (s: string) => createHash("sha512").update(s, "utf8").digest("hex");

/** Paga concatenates only the fields that are present (nulls skipped), then appends the hash key. */
function hashOf(parts: (string | number | null | undefined)[]) {
  return sha512(parts.filter((p) => p !== null && p !== undefined && p !== "").join("") + hashKey());
}

function safeEqualHex(a: string, b: string) {
  const x = Buffer.from(a.toLowerCase());
  const y = Buffer.from(b.toLowerCase());
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Paga timestamps: "2026-04-23T11:45:00" (UTC, no zone suffix). */
const pagaDate = (d: Date) => d.toISOString().slice(0, 19);

async function call<T>(endpoint: string, body: Record<string, unknown>, hash: string): Promise<T> {
  const mode = pagaMode();
  if (mode === "mock") throw new Error("call() is not used in mock mode");
  const auth = Buffer.from(`${process.env.PAGA_PUBLIC_KEY}:${process.env.PAGA_SECRET_KEY}`).toString("base64");
  const res = await fetch(BASE[mode] + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
      hash,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Paga ${endpoint} returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
  return json as T;
}

/* ------------------------------------------------------------------ */
/* 1. Request Payment                                                 */
/* ------------------------------------------------------------------ */

export type PaymentInstructions = {
  amountToPay: number;
  bankTransfer?: { bankName: string; accountNumber: string };
  ussd?: { code: string; reference?: string };
  pagaLink?: string;
  expiresAt: string;
};

type PagaMethod = { name: string; properties: Record<string, string> };
type PaymentRequestResponse = {
  referenceNumber: string;
  statusCode: string;
  statusMessage: string;
  requestAmount?: number;
  totalPaymentAmount?: number;
  paymentMethods?: PagaMethod[];
  expiryDateTimeUTC?: string;
};

export async function requestPayment(input: {
  reference: string;
  amount: number;
  payerName: string;
  payerEmail?: string | null;
  payerPhone?: string | null;
  payeeName: string;
  callbackUrl: string;
  redirectUrl: string;
  expiresAt: Date;
}): Promise<PaymentInstructions> {
  const mode = pagaMode();

  if (mode === "mock") {
    // Deterministic fake NUBAN so the screen looks real and stays stable on reload.
    const digits = sha512(input.reference).replace(/\D/g, "").padEnd(10, "7");
    return {
      amountToPay: input.amount,
      bankTransfer: { bankName: "Paga (demo)", accountNumber: "10" + digits.slice(0, 8) },
      ussd: { code: `*242*${digits.slice(0, 8)}#`, reference: digits.slice(0, 8) },
      expiresAt: input.expiresAt.toISOString(),
    };
  }

  // Organiser absorbs Paga's collection fee by default so payers transfer the exact amount.
  const payerShare = Number(process.env.PAGA_PAYER_FEE_SHARE ?? "0");
  const body = {
    referenceNumber: input.reference,
    amount: input.amount,
    currency: "NGN",
    payer: {
      name: input.payerName.slice(0, 60),
      ...(input.payerPhone ? { phoneNumber: input.payerPhone } : {}),
      ...(input.payerEmail ? { email: input.payerEmail } : {}),
    },
    // No payee identifier -> funds go to our Paga business account (the processor).
    payee: { name: input.payeeName.slice(0, 60) },
    expiryDateTimeUTC: pagaDate(input.expiresAt),
    isSuppressMessages: true,
    payerCollectionFeeShare: payerShare,
    payeeCollectionFeeShare: 1 - payerShare,
    isAllowPartialPayments: false,
    isAllowOverPayments: false,
    callBackUrl: input.callbackUrl,
    // Paga's dynamic virtual account flow: bank transfer only (redirectUrl is for Paga Wallet payments).
    paymentMethods: ["BANK_TRANSFER"],
  };
  // hash: referenceNumber + amount + currency + payer.phoneNumber + payer.email + hashKey
  // (an empty string for any of them that isn't sent)
  const hash = hashOf([input.reference, input.amount, "NGN", input.payerPhone ?? null, input.payerEmail ?? null]);
  const res = await call<PaymentRequestResponse>("paymentRequest", body, hash);
  if (res.statusCode !== "0") {
    console.error("[paga] paymentRequest reply", JSON.stringify(res).slice(0, 500));
    throw new Error(`Paga paymentRequest failed: ${res.statusCode} ${res.statusMessage}`);
  }

  const out: PaymentInstructions = {
    amountToPay: res.totalPaymentAmount ?? input.amount,
    expiresAt: res.expiryDateTimeUTC ? new Date(res.expiryDateTimeUTC + "Z").toISOString() : input.expiresAt.toISOString(),
  };
  for (const m of res.paymentMethods ?? []) {
    const p = m.properties ?? {};
    if (m.name === "BANK_TRANSFER") {
      out.bankTransfer = { bankName: p.bankName ?? "Paga", accountNumber: p.AccountNumber ?? p.accountNumber ?? p.paymentCode };
    } else if (m.name === "FUNDING_USSD" || (m.name === "USSD" && !out.ussd)) {
      out.ussd = { code: p.USSDShortCode ?? p.ussdShortCode ?? p.paymentCode, reference: p.PaymentReference };
    } else if (m.name === "REQUEST_MONEY") {
      out.pagaLink = p.WebPaymentLink;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 2. Independent server-side verification                            */
/* ------------------------------------------------------------------ */

type HistoryResponse = {
  statusCode: string;
  statusMessage: string;
  items?: { referenceNumber: string; operation: string; action: string; amount: number; status: string }[];
};

export type Verification = { paid: boolean; amountPaid: number; detail: string; unavailable?: boolean };

const PAID_STATES = new Set(["SUCCESSFUL", "SUCCESS", "PAID", "PAID_NOT_SETTLED", "COMPLETED", "COMPLETE", "PAYMENT_COMPLETE", "SETTLED"]);

/** Paga's "check payment status" call. Its reply shape differs between doc versions, so read it loosely. */
async function statusCheck(reference: string): Promise<Verification | null> {
  try {
    const r = await call<Record<string, unknown>>("status", { referenceNumber: reference }, hashOf([reference]));
    // The outer statusCode only says the lookup worked. Per Paga's docs the payment itself is
    // reported in data.statusCode: "0" = paid, "1" = in process, "2" = partly paid, "-2" = expired.
    if (String(r.statusCode) !== "0") return null; // not available, or an error: try the next way
    const data = (r.data ?? r) as Record<string, unknown>;
    const code = r.data ? String(data.statusCode ?? "") : "";
    const state = String(data.status ?? data.paymentStatus ?? data.state ?? r.status ?? "").toUpperCase();
    if (!code && !state) return null; // a reply shape we don't recognise: let the history check decide
    const paid = code === "0" || PAID_STATES.has(state);
    const amount = Number(data.amountPaid ?? data.cumulativePaymentAmount ?? data.paymentAmount ?? data.totalPaymentAmount ?? data.amount ?? 0);
    return { paid, amountPaid: amount, detail: `status: ${code ? `code ${code} ${String(data.statusMessage ?? "")}`.trim() : state}` };
  } catch (e) {
    console.error("[paga] status check failed", reference, (e as Error).message);
    return null;
  }
}

/**
 * Ask Paga directly whether money arrived for this reference. We never trust the
 * browser. With a working status call we don't rely on a webhook alone either:
 * a valid hash proves the message came from Paga, this proves Paga's records agree.
 */
export async function verifyPayment(reference: string, createdAt: Date): Promise<Verification> {
  const mode = pagaMode();

  if (mode === "mock") {
    const rows = await q<{ total: number | null; n: number }>(
      "select sum(amount) as total, count(*)::int as n from mock_paga_payments where reference = $1",
      [reference],
    );
    const total = Number(rows[0]?.total ?? 0);
    return { paid: total > 0, amountPaid: total, detail: `mock ledger: ${rows[0]?.n ?? 0} payment(s)` };
  }

  const st = await statusCheck(reference);
  if (st) return st;

  try {
    const start = new Date(createdAt.getTime() - 60 * 60 * 1000);
    const end = new Date(Date.now() + 60 * 60 * 1000);
    const res = await call<HistoryResponse>(
      "history",
      { referenceNumber: reference, startDateTimeUTC: pagaDate(start), endDateTimeUTC: pagaDate(end) },
      hashOf([reference]),
    );
    if (res.statusCode !== "0") {
      return { paid: false, amountPaid: 0, detail: `history ${res.statusCode}: ${res.statusMessage}`, unavailable: true };
    }
    const payments = (res.items ?? []).filter(
      (i) => i.action === "PAYMENT" && (i.status === "SUCCESSFUL" || i.status === "PAID_NOT_SETTLED"),
    );
    const total = payments.reduce((s, i) => s + Number(i.amount || 0), 0);
    return { paid: payments.length > 0, amountPaid: total, detail: `history: ${payments.length} successful payment(s)` };
  } catch (e) {
    return { paid: false, amountPaid: 0, detail: `history failed: ${(e as Error).message}`, unavailable: true };
  }
}

/* ------------------------------------------------------------------ */
/* 3. Callback (webhook) authentication                               */
/* ------------------------------------------------------------------ */

export type PagaCallback = {
  event?: string;
  notificationId?: string;
  statusCode?: string;
  statusMessage?: string;
  externalReferenceNumber?: string;
  state?: string;
  outstandingBalance?: number | string | null;
  paymentAmount?: number;
  cumulativePaymentAmount?: number;
  collectionFee?: number;
  fundingPaymentReference?: string;
  fundingDetails?: { paymentReferenceNumber?: string; payerName?: string | null; payerBankName?: string | null };
  hash?: string;
  [k: string]: unknown;
};

/** Java DecimalFormat("#.00") as used by Paga: 0 -> ".00", 7048.384 -> "7048.38". */
function javaHashDecimal(v: number) {
  const fixed = v.toFixed(2);
  return fixed.startsWith("0.") ? fixed.slice(1) : fixed.startsWith("-0.") ? "-" + fixed.slice(2) : fixed;
}

/**
 * Payment-request callback hash:
 *   SHA512(notificationId + statusCode + externalReferenceNumber + state + outstandingBalance + hashKey)
 * outstandingBalance is omitted when null, else formatted "#.00".
 * We also accept the header style (x-paga-hash + x-paga-hash-parameters) Paga uses on newer webhooks.
 */
export function verifyCallback(payload: PagaCallback, headers?: Headers): boolean {
  const headerHash = headers?.get("x-paga-hash");
  const headerParams = headers?.get("x-paga-hash-parameters");
  if (headerHash && headerParams) {
    const fields = headerParams.split(",").map((f) => f.trim()).filter((f) => f && f !== "hashKey");
    const expected = sha512(fields.map((f) => String(payload[f] ?? "")).join("") + hashKey());
    return safeEqualHex(expected, headerHash);
  }

  if (!payload.hash) return false;
  const base = [payload.notificationId, payload.statusCode, payload.externalReferenceNumber, payload.state];
  const ob = payload.outstandingBalance;
  const candidates: string[] = [];
  if (ob === null || ob === undefined || ob === "") {
    candidates.push(hashOf(base));
  } else {
    const n = Number(ob);
    // Primary: exact "#.00" format from the docs. Fallback: "0.00" style for zero balances.
    candidates.push(hashOf([...base, javaHashDecimal(n)]));
    candidates.push(hashOf([...base, n.toFixed(2)]));
  }
  return candidates.some((c) => safeEqualHex(c, payload.hash!));
}

/* ------------------------------------------------------------------ */
/* 4. Mock-mode helpers (demo only)                                   */
/* ------------------------------------------------------------------ */

/** Build a callback exactly as Paga would send it, signed with the hash key. */
export function buildMockCallback(reference: string, amount: number, notificationId: string): PagaCallback {
  const payload: PagaCallback = {
    event: "PAYMENT_COMPLETE",
    notificationId,
    statusCode: "0",
    statusMessage: "Payment Request has been authorized",
    externalReferenceNumber: reference,
    state: "CHARGEABLE",
    outstandingBalance: 0,
    paymentAmount: amount,
    cumulativePaymentAmount: amount,
    collectionFee: 0,
    fundingDetails: { paymentReferenceNumber: `MOCK|${notificationId.slice(0, 8)}`, payerBankName: "Access Bank" },
  };
  payload.hash = hashOf([
    payload.notificationId,
    payload.statusCode,
    payload.externalReferenceNumber,
    payload.state,
    javaHashDecimal(0),
  ]);
  return payload;
}

/** Describes a key without revealing it: length, and whether it has stray spaces or quotes from pasting. */
export function keyHint(v: string | undefined) {
  if (!v) return "missing";
  const issues = [];
  if (v !== v.trim()) issues.push("has spaces or a line break at the start/end, remove them");
  if (/^["']|["']$/.test(v.trim())) issues.push("wrapped in quotes, remove them");
  return `${v.length} characters${issues.length ? " (" + issues.join("; ") + ")" : ""}`;
}

/** Setup check: one harmless Collect call (/banks), reporting exactly what Paga replied. */
export async function collectPing(): Promise<{ mode: PagaMode; ok: boolean; detail: string; httpStatus?: number; pagaReplied?: string; keys?: Record<string, string> }> {
  const mode = pagaMode();
  const keys = { PAGA_PUBLIC_KEY: keyHint(process.env.PAGA_PUBLIC_KEY), PAGA_SECRET_KEY: keyHint(process.env.PAGA_SECRET_KEY), PAGA_HASH_KEY: keyHint(process.env.PAGA_HASH_KEY) };
  if (mode === "mock") return { mode, ok: false, detail: "No Collect keys set (PAGA_PUBLIC_KEY, PAGA_SECRET_KEY, PAGA_HASH_KEY), so the app is in demo mode.", keys };
  const referenceNumber = `KCHK${Date.now()}`;
  try {
    const auth = Buffer.from(`${process.env.PAGA_PUBLIC_KEY}:${process.env.PAGA_SECRET_KEY}`).toString("base64");
    const res = await fetch(BASE[mode] + "banks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Basic ${auth}`, hash: hashOf([referenceNumber]) },
      body: JSON.stringify({ referenceNumber }),
      cache: "no-store",
    });
    const text = await res.text();
    let r: Record<string, unknown> = {};
    try { r = JSON.parse(text); } catch { /* not JSON */ }
    const code = r.statusCode ?? r.responseCode;
    const good = res.ok && Number(code) === 0;
    return { mode, ok: good, httpStatus: res.status, detail: good ? "Connected to Paga Collect." : `Paga replied ${code ?? "(no code)"}: ${r.statusMessage ?? r.message ?? r.error ?? "see pagaReplied"}`, pagaReplied: text.slice(0, 400), keys };
  } catch (e) {
    return { mode, ok: false, detail: String((e as Error).message).slice(0, 300), keys };
  }
}
