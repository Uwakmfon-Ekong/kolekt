import "server-only";
import { randomBytes } from "node:crypto";
import { getDb, q } from "./db";
import { pagaMode, requestPayment, verifyPayment, type PaymentInstructions } from "./paga";
import { fields, getCollectionBySlug, isOpen } from "./collections";
import { isEmail, isPhone, normalizeIdentifier } from "./utils";

export class UserError extends Error {}

/** Unguessable payment reference. It also opens the receipt, so it must not be enumerable. */
function newReference() {
  return `KLK-${randomBytes(10).toString("base64url").replace(/[-_]/g, "X").toUpperCase()}`;
}

const MIN_AMOUNT = 100;
const MAX_AMOUNT = 5_000_000;
const REQUEST_TTL_HOURS = 24;

const find = (values: Record<string, string>, re: RegExp) =>
  Object.entries(values).find(([k, v]) => re.test(k) && v.trim())?.[1]?.trim() ?? "";

/**
 * Checkout. The contributor fills in the fields the organiser asked for (and an amount
 * for flexible collections). We create a pending transaction and a Paga payment request,
 * which gives the payer a one-time account number to transfer to.
 */
export async function startContribution(input: {
  slug: string;
  values: Record<string, string>;
  amount?: number;
  appUrl: string;
}): Promise<{ reference: string }> {
  const c = await getCollectionBySlug(input.slug);
  if (!c) throw new UserError("This collection does not exist.");
  if (!isOpen(c)) throw new UserError("This collection is not accepting contributions right now.");

  // Keep only the fields this collection asks for, trimmed and length-capped.
  const wanted = fields(c);
  const values: Record<string, string> = {};
  for (const f of wanted) values[f] = String(input.values[f] ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
  const missing = wanted.filter((f) => !values[f]);
  if (missing.length) throw new UserError(`Please complete: ${missing.join(", ")}.`);

  const name = values["Full Name"] || find(values, /name/i);
  if (name.length < 3) throw new UserError("Please enter your full name.");
  const email = find(values, /e-?mail/i);
  const phone = find(values, /phone|mobile|whatsapp/i);
  if (email && !isEmail(email)) throw new UserError("Please enter a valid email address.");
  if (phone && !isPhone(phone)) throw new UserError("Please enter a valid phone number.");

  // What identifies this person in the collection: their ID number, else phone, email or name.
  const id = find(values, /matric|reg(istration)?\b|reg\.|member|staff|student id|id number/i);
  const payerKey = normalizeIdentifier(id || phone || email || name);

  let amount: number;
  if (c.collection_type === "fixed") {
    amount = Number(c.fixed_amount);
  } else {
    amount = Math.round(Number(input.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount < MIN_AMOUNT) throw new UserError(`The minimum contribution is ₦${MIN_AMOUNT}.`);
    if (amount > MAX_AMOUNT) throw new UserError("That amount is too large for a single contribution.");
    if (c.min_amount && amount < Number(c.min_amount))
      throw new UserError(`The minimum contribution is ₦${Number(c.min_amount).toLocaleString("en-NG")}.`);
    if (!c.allow_above_target && c.target_amount) {
      const left = Number(c.target_amount) - Number(c.collected ?? 0);
      if (left <= 0) throw new UserError("This collection has reached its target.");
      if (amount > left) throw new UserError(`Only ₦${left.toLocaleString("en-NG")} is left to reach the target.`);
    }
  }

  // Re-use an open payment request instead of minting a new account number on every refresh.
  const [existing] = await q<{ reference: string }>(
    `select reference from transactions
      where collection_id = $1 and payer_key = $2 and status = 'pending'
        and amount = $3 and expires_at > now() + interval '30 minutes'
      order by created_at desc limit 1`,
    [c.id, payerKey, amount],
  );
  if (existing) return existing;

  const reference = newReference();
  const expiresAt = new Date(Date.now() + REQUEST_TTL_HOURS * 3600e3);
  await q(
    `insert into transactions
       (collection_id, reference, amount, currency, payer_name, payer_email, payer_phone, payer_key, payer_details, provider_mode, expires_at)
     values ($1,$2,$3,'NGN',$4,$5,$6,$7,$8,$9,$10)`,
    [c.id, reference, amount, name, email || null, phone || null, payerKey, JSON.stringify(values), pagaMode(), expiresAt.toISOString()],
  );

  let instructions: PaymentInstructions;
  try {
    instructions = await requestPayment({
      reference,
      amount,
      payerName: name,
      // Paga needs a phone number or email for the payer. Messages are suppressed, so if the
      // contributor gave neither we pass a configured operations address.
      payerPhone: phone || null,
      payerEmail: email || (phone ? null : process.env.PAGA_PAYER_EMAIL || "payments@kolekt.app"),
      payeeName: `${c.organisation || c.organiser_name || "Kolekt"} - ${c.title}`,
      callbackUrl: `${input.appUrl}/api/webhooks/paga`,
      redirectUrl: `${input.appUrl}/pay/${reference}`,
      expiresAt,
    });
  } catch (e) {
    console.error("[paga] paymentRequest failed", reference, e);
    await q("update transactions set status = 'failed' where reference = $1", [reference]);
    throw new UserError("We couldn't reach the payment provider. Please try again in a moment.");
  }

  await q(`update transactions set payment_instructions = $2, amount_to_pay = $3, expires_at = $4 where reference = $1`, [
    reference,
    JSON.stringify(instructions),
    instructions.amountToPay,
    instructions.expiresAt,
  ]);
  return { reference };
}

export type SettleResult =
  | { outcome: "settled"; review: "none" | "duplicate" }
  | { outcome: "already_final"; status: string }
  | { outcome: "not_paid"; detail: string }
  | { outcome: "not_found" };

type TxLock = { id: string; status: string; collection_id: string; payer_key: string; collection_type: string; created_at: string };

/**
 * Mark a transaction successful ONLY after Paga's ledger confirms the money.
 * Idempotent and race-safe: duplicate webhooks, retries and status polls can all
 * call this at the same time and the payment is still counted exactly once.
 */
export async function settleTransaction(
  reference: string,
  hints: { providerReference?: string; paymentMethod?: string } = {},
): Promise<SettleResult> {
  const [pre] = await q<{ status: string; created_at: string }>("select status, created_at from transactions where reference = $1", [reference]);
  if (!pre) return { outcome: "not_found" };
  if (pre.status !== "pending") return { outcome: "already_final", status: pre.status };

  // The network call happens outside the database transaction, so no row lock is held during I/O.
  const v = await verifyPayment(reference, new Date(pre.created_at));
  if (!v.paid) return { outcome: "not_paid", detail: v.detail };

  const db = await getDb();
  return db.tx(async (tx) => {
    const [t] = await tx.query<TxLock>(
      `select t.id, t.status, t.collection_id, t.payer_key, t.created_at, c.collection_type
         from transactions t join collections c on c.id = t.collection_id
        where t.reference = $1
        for update of t`,
      [reference],
    );
    if (!t) return { outcome: "not_found" } as const;
    if (t.status !== "pending") return { outcome: "already_final", status: t.status } as const;

    // On a fixed collection, a second payment from the same person is flagged for the organiser.
    let review: "none" | "duplicate" = "none";
    if (t.collection_type === "fixed") {
      const [prior] = await tx.query<{ n: number }>(
        `select count(*)::int as n from transactions
          where collection_id = $1 and payer_key = $2 and status = 'successful' and id <> $3`,
        [t.collection_id, t.payer_key, t.id],
      );
      if ((prior?.n ?? 0) > 0) review = "duplicate";
    }

    await tx.query(
      `update transactions
          set status = 'successful', verified_at = now(), review_status = $2,
              provider_reference = coalesce($3, provider_reference),
              payment_method = coalesce($4, payment_method, 'BANK_TRANSFER')
        where id = $1`,
      [t.id, review, hints.providerReference ?? null, hints.paymentMethod ?? null],
    );
    return { outcome: "settled", review } as const;
  });
}

export async function markPendingAs(reference: string, status: "failed" | "expired") {
  await q("update transactions set status = $2 where reference = $1 and status = 'pending'", [reference, status]);
}
