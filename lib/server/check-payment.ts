import "server-only";
import { q } from "./db";
import { getCollectionBySlug } from "./collections";
import { nameKey } from "./members";
import { normalizeIdentifier } from "./utils";
import type { PaymentCheck } from "../data";

/** "BLESSING etim" -> "Blessing E." The full name isn't shown back, in case someone looks up a classmate. */
function shortName(n: string) {
  const parts = n.trim().split(/\s+/);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return cap(parts[0] ?? "") + (parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "");
}

/**
 * Public "Check my payment": a contributor types the ID they paid with (matric number,
 * phone, email, or their name if that's all the collection asks for) and sees what Kolekt
 * has received from them, their balance and their receipts.
 */
export async function checkPayment(slug: string, identifier: string): Promise<PaymentCheck> {
  const c = await getCollectionBySlug(slug);
  if (!c) return { found: false, message: "This collection doesn’t exist." };
  const raw = identifier.trim().slice(0, 80);
  const key = normalizeIdentifier(raw);
  if (key.length < 3) return { found: false, message: "Type your matric number, phone number or email." };

  const [txs, members, pending] = await Promise.all([
    q<{ reference: string; amount: number; verified_at: string | Date; payer_name: string; refunded: number | null }>(
      `select t.reference, t.amount, t.verified_at, t.payer_name,
              (select sum(p.amount) from payouts p where p.transaction_reference = t.reference and p.kind = 'refund' and p.status <> 'failed') as refunded
         from transactions t
        where t.collection_id = $1 and t.status = 'successful' and t.payer_key = $2
        order by t.verified_at desc`,
      [c.id, key],
    ),
    q<{ full_name: string; member_key: string; name_key: string }>(
      "select full_name, member_key, name_key from collection_members where collection_id = $1 and (member_key = $2 or name_key = $3) limit 1",
      [c.id, key, nameKey(raw)],
    ),
    q<{ reference: string; amount: number }>(
      `select reference, amount from transactions
        where collection_id = $1 and payer_key = $2 and status = 'pending' and expires_at > now()
        order by created_at desc limit 1`,
      [c.id, key],
    ),
  ]);

  // On the class list but paid under a different ID? Fall back to the list's ID, then the name.
  let rows = txs;
  const m = members[0];
  if (!rows.length && m) {
    rows = await q(
      `select t.reference, t.amount, t.verified_at, t.payer_name,
              (select sum(p.amount) from payouts p where p.transaction_reference = t.reference and p.kind = 'refund' and p.status <> 'failed') as refunded
         from transactions t
        where t.collection_id = $1 and t.status = 'successful'
          and (t.payer_key = $2 or upper(regexp_replace(t.payer_name, '[^A-Za-z0-9]', '', 'g')) = $3)
        order by t.verified_at desc`,
      [c.id, m.member_key, m.name_key],
    );
  }

  if (!rows.length && !m && !pending.length) {
    return { found: false, message: "We haven’t received a payment with that ID. Check how you typed it, or pay below." };
  }
  const refunded = rows.reduce((s, r) => s + Number(r.refunded ?? 0), 0);
  const paid = rows.reduce((s, r) => s + Number(r.amount), 0) - refunded;
  const expected = c.collection_type === "fixed" ? Number(c.fixed_amount) : null;
  return {
    found: true,
    name: shortName(m?.full_name ?? rows[0]?.payer_name ?? "You"),
    onList: Boolean(m),
    paid,
    refunded,
    expected,
    balance: expected ? Math.max(0, expected - paid) : 0,
    status: expected ? (paid <= 0 ? "unpaid" : paid < expected ? "part" : "paid") : paid > 0 ? "contributed" : "unpaid",
    payments: rows.map((r) => ({ reference: r.reference, amount: Number(r.amount), paidAt: new Date(r.verified_at).toISOString(), refunded: Number(r.refunded ?? 0) })),
    pending: pending[0] ? { reference: pending[0].reference, amount: Number(pending[0].amount) } : null,
  };
}
