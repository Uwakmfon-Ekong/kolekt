import "server-only";
import { randomBytes } from "node:crypto";
import { getDb, one, q } from "./db";
import { businessMode, depositToBank, getBanks, operationStatus, validateAccount } from "./paga-business";

export class PayoutError extends Error {}

export type Payout = {
  reference: string;
  amount: number;
  fee: number;
  status: "processing" | "successful" | "failed";
  bankName: string;
  accountNumber: string;
  accountName: string;
  message: string | null;
  createdAt: string;
  kind: "withdrawal" | "refund";
  transactionReference: string | null;
};

type PayoutRow = {
  reference: string;
  amount: number;
  fee: number | null;
  status: Payout["status"];
  bank_name: string;
  account_number: string;
  account_name: string;
  message: string | null;
  created_at: string | Date;
  kind?: string | null;
  transaction_reference?: string | null;
};

const MIN_PAYOUT = 100;

const toPayout = (r: PayoutRow): Payout => ({
  reference: r.reference,
  amount: Number(r.amount),
  fee: Number(r.fee ?? 0),
  status: r.status,
  bankName: r.bank_name,
  accountNumber: r.account_number,
  accountName: r.account_name,
  message: r.message,
  createdAt: new Date(r.created_at).toISOString(),
  kind: r.kind === "refund" ? "refund" : "withdrawal",
  transactionReference: r.transaction_reference ?? null,
});

/** Verified contributions minus payouts that are done or still in flight. */
export async function balanceFor(collectionId: string) {
  const r = await one<{ collected: number | null; paid_out: number | null; processing: number | null }>(
    `select
       (select sum(amount) from transactions where collection_id = $1 and status = 'successful') as collected,
       (select sum(amount) from payouts where collection_id = $1 and status = 'successful') as paid_out,
       (select sum(amount) from payouts where collection_id = $1 and status = 'processing') as processing`,
    [collectionId],
  );
  const collected = Number(r?.collected ?? 0);
  const paidOut = Number(r?.paid_out ?? 0);
  const processing = Number(r?.processing ?? 0);
  return { collected, paidOut, processing, available: Math.max(0, collected - paidOut - processing) };
}

export async function listPayouts(collectionId: string): Promise<Payout[]> {
  const rows = await q<PayoutRow>("select * from payouts where collection_id = $1 order by created_at desc", [collectionId]);
  return rows.map(toPayout);
}

/**
 * Withdraw from a collection to the organiser's saved (Paga-verified) bank account.
 * The amount is reserved under a row lock first, so two clicks or two tabs can never
 * pay out more than was collected.
 */
export async function requestPayout(input: { organiserId: string; collectionId: string; amount: number; appUrl: string }): Promise<Payout> {
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount < MIN_PAYOUT) throw new PayoutError(`The minimum withdrawal is ₦${MIN_PAYOUT}.`);

  const acct = await one<{ payout_bank_uuid: string | null; payout_bank_name: string; payout_account_number: string; payout_account_name: string; full_name: string }>(
    "select payout_bank_uuid, payout_bank_name, payout_account_number, payout_account_name, full_name from organisers where id = $1",
    [input.organiserId],
  );
  if (!acct?.payout_bank_uuid) throw new PayoutError("Add your payout bank account in your profile first.");

  const reference = `KPO-${randomBytes(9).toString("base64url").replace(/[-_]/g, "X").toUpperCase()}`;
  const db = await getDb();
  const reserved = await db.tx(async (tx) => {
    const [c] = await tx.query<{ id: string; title: string }>(
      "select id, title from collections where id = $1 and organiser_id = $2 for update",
      [input.collectionId, input.organiserId],
    );
    if (!c) throw new PayoutError("Collection not found.");
    const [b] = await tx.query<{ collected: number | null; out: number | null }>(
      `select (select sum(amount) from transactions where collection_id = $1 and status = 'successful') as collected,
              (select sum(amount) from payouts where collection_id = $1 and status in ('processing','successful')) as out`,
      [c.id],
    );
    const available = Number(b?.collected ?? 0) - Number(b?.out ?? 0);
    if (amount > available + 0.001) throw new PayoutError(`You can withdraw up to ₦${Math.max(0, available).toLocaleString("en-NG")}.`);
    await tx.query(
      `insert into payouts (organiser_id, collection_id, reference, amount, status, bank_name, account_number, account_name, provider_mode)
       values ($1,$2,$3,$4,'processing',$5,$6,$7,$8)`,
      [input.organiserId, c.id, reference, amount, acct.payout_bank_name, acct.payout_account_number, acct.payout_account_name, businessMode()],
    );
    return c;
  });

  try {
    const r = await depositToBank({
      reference,
      amount,
      bankUUID: acct.payout_bank_uuid,
      accountNumber: acct.payout_account_number,
      recipientName: acct.payout_account_name,
      remarks: `Kolekt payout: ${reserved.title}`,
      callbackUrl: `${input.appUrl}/api/webhooks/paga-payout`,
    });
    if (r.status === "failed") {
      await q("update payouts set status = 'failed', message = $2, updated_at = now() where reference = $1", [reference, r.message]);
    } else {
      await q(
        "update payouts set status = $2, fee = $3, provider_transaction_id = $4, message = $5, updated_at = now() where reference = $1",
        [reference, r.status, r.fee, r.transactionId, r.message],
      );
    }
  } catch (e) {
    // We don't know whether Paga received it, so the money stays reserved until a status check settles it.
    console.error("[payout] depositToBank failed", reference, e);
    await q("update payouts set message = $2, updated_at = now() where reference = $1", [reference, "Confirming with Paga…"]);
  }
  const row = await one<PayoutRow>("select * from payouts where reference = $1", [reference]);
  return toPayout(row!);
}

/** Settle a payout that's still "processing" by asking Paga. */
export async function refreshPayout(organiserId: string, reference: string): Promise<Payout | null> {
  const row = await one<PayoutRow>("select * from payouts where reference = $1 and organiser_id = $2", [reference, organiserId]);
  if (!row) return null;
  if (row.status === "processing") {
    try {
      const s = await operationStatus(reference);
      if (s !== "processing") {
        await q("update payouts set status = $2, updated_at = now() where reference = $1 and status = 'processing'", [reference, s]);
      }
    } catch (e) {
      console.error("[payout] status check failed", reference, e);
    }
  }
  return toPayout((await one<PayoutRow>("select * from payouts where reference = $1", [reference]))!);
}

/**
 * Refund (part of) a verified payment to the contributor's bank account through Paga.
 * Same safety as withdrawals: the account holder's name comes from Paga, the amount is
 * reserved under a row lock, and a payment can never be refunded for more than it was.
 */
export async function requestRefund(input: {
  organiserId: string;
  collectionId: string;
  transactionReference: string;
  amount: number;
  bankUUID: string;
  accountNumber: string;
  appUrl: string;
}): Promise<Payout> {
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount < MIN_PAYOUT) throw new PayoutError(`The smallest refund is ₦${MIN_PAYOUT}.`);
  const accountNumber = String(input.accountNumber).trim();

  const tx0 = await one<{ payer_name: string }>(
    "select t.payer_name from transactions t join collections c on c.id = t.collection_id where t.reference = $1 and c.id = $2 and c.organiser_id = $3 and t.status = 'successful'",
    [input.transactionReference, input.collectionId, input.organiserId],
  );
  if (!tx0) throw new PayoutError("That payment wasn’t found.");
  const bank = (await getBanks()).find((b) => b.uuid === input.bankUUID);
  if (!bank) throw new PayoutError("Choose the contributor’s bank.");
  const check = await validateAccount({ bankUUID: bank.uuid, accountNumber, amount, fallbackName: tx0.payer_name });
  if (!check.ok) throw new PayoutError(check.error);

  const reference = `KRF-${randomBytes(9).toString("base64url").replace(/[-_]/g, "X").toUpperCase()}`;
  const db = await getDb();
  const title = await db.tx(async (tx) => {
    const [c] = await tx.query<{ id: string; title: string }>(
      "select id, title from collections where id = $1 and organiser_id = $2 for update",
      [input.collectionId, input.organiserId],
    );
    if (!c) throw new PayoutError("Collection not found.");
    const [t] = await tx.query<{ amount: number; refunded: number | null }>(
      `select t.amount,
              (select sum(p.amount) from payouts p where p.transaction_reference = t.reference and p.kind = 'refund' and p.status in ('processing','successful')) as refunded
         from transactions t where t.reference = $1 and t.collection_id = $2 and t.status = 'successful'`,
      [input.transactionReference, c.id],
    );
    if (!t) throw new PayoutError("That payment wasn’t found.");
    const refundable = Number(t.amount) - Number(t.refunded ?? 0);
    if (refundable <= 0) throw new PayoutError("This payment has already been refunded in full.");
    if (amount > refundable + 0.001) throw new PayoutError(`You can refund up to ₦${refundable.toLocaleString("en-NG")} of this payment.`);
    const [b] = await tx.query<{ collected: number | null; out: number | null }>(
      `select (select sum(amount) from transactions where collection_id = $1 and status = 'successful') as collected,
              (select sum(amount) from payouts where collection_id = $1 and status in ('processing','successful')) as out`,
      [c.id],
    );
    const available = Number(b?.collected ?? 0) - Number(b?.out ?? 0);
    if (amount > available + 0.001)
      throw new PayoutError(`Only ₦${Math.max(0, available).toLocaleString("en-NG")} is left in this collection (the rest has been withdrawn).`);
    await tx.query(
      `insert into payouts (organiser_id, collection_id, reference, amount, status, bank_name, account_number, account_name, provider_mode, kind, transaction_reference)
       values ($1,$2,$3,$4,'processing',$5,$6,$7,$8,'refund',$9)`,
      [input.organiserId, c.id, reference, amount, bank.name, accountNumber, check.accountName, businessMode(), input.transactionReference],
    );
    return c.title;
  });

  try {
    const r = await depositToBank({
      reference,
      amount,
      bankUUID: bank.uuid,
      accountNumber,
      recipientName: check.accountName,
      remarks: `Kolekt refund: ${title}`,
      callbackUrl: `${input.appUrl}/api/webhooks/paga-payout`,
    });
    if (r.status === "failed") {
      await q("update payouts set status = 'failed', message = $2, updated_at = now() where reference = $1", [reference, r.message]);
    } else {
      await q(
        "update payouts set status = $2, fee = $3, provider_transaction_id = $4, message = $5, updated_at = now() where reference = $1",
        [reference, r.status, r.fee, r.transactionId, r.message],
      );
    }
  } catch (e) {
    console.error("[refund] depositToBank failed", reference, e);
    await q("update payouts set message = $2, updated_at = now() where reference = $1", [reference, "Confirming with Paga…"]);
  }
  return toPayout((await one<PayoutRow>("select * from payouts where reference = $1", [reference]))!);
}
