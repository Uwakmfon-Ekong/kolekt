import "server-only";
import { q } from "./db";
import { nameKey } from "./members";
import type { CollectionRow } from "./collections";
import type { Contributor, ContributorSummary, PaymentLine, RefundLine } from "../data";

type TxRow = {
  reference: string;
  payer_key: string;
  payer_name: string;
  payer_phone: string | null;
  amount: number;
  verified_at: string | Date;
  payment_method: string | null;
  payer_details: Record<string, string> | string | null;
  review_status: string;
};
type MemberRow = { id: string; full_name: string; member_id: string | null; phone: string | null; member_key: string; name_key: string };

type Group = { key: string; name: string; phone: string | null; details: Record<string, string>; payments: PaymentLine[]; paid: number; refunded: number; claimed: boolean };
type RefundRow = { reference: string; transaction_reference: string; amount: number; status: RefundLine["status"]; account_name: string; bank_name: string; created_at: string | Date };

const parse = (v: TxRow["payer_details"]) => (typeof v === "string" ? JSON.parse(v) : v ?? {}) as Record<string, string>;

/**
 * Everyone in a collection, one row per person. Payments are grouped by the payer's
 * identifier (matric/ID, else phone, email or name, normalised), so two transfers from the
 * same student become one contributor with two payments. Class-list members are matched by
 * ID first, then by name; members with no payment appear as "unpaid".
 */
export async function listContributors(c: Pick<CollectionRow, "id" | "collection_type" | "fixed_amount">): Promise<{ contributors: Contributor[]; summary: ContributorSummary }> {
  const [txs, members, refundRows] = await Promise.all([
    q<TxRow>(
      `select reference, payer_key, payer_name, payer_phone, amount, verified_at, payment_method, payer_details, review_status
         from transactions where collection_id = $1 and status = 'successful'
        order by verified_at asc`,
      [c.id],
    ),
    q<MemberRow>("select id, full_name, member_id, phone, member_key, name_key from collection_members where collection_id = $1 order by full_name", [c.id]),
    q<RefundRow>(
      "select reference, transaction_reference, amount, status, account_name, bank_name, created_at from payouts where collection_id = $1 and kind = 'refund' order by created_at desc",
      [c.id],
    ),
  ]);
  const refundsByTx = new Map<string, RefundLine[]>();
  for (const r of refundRows) {
    const line: RefundLine = { reference: r.reference, amount: Number(r.amount), status: r.status, accountName: r.account_name, bankName: r.bank_name, at: new Date(r.created_at).toISOString() };
    refundsByTx.set(r.transaction_reference, [...(refundsByTx.get(r.transaction_reference) ?? []), line]);
  }

  const groups = new Map<string, Group>();
  for (const t of txs) {
    const g = groups.get(t.payer_key) ?? { key: t.payer_key, name: t.payer_name, phone: null, details: {}, payments: [], paid: 0, refunded: 0, claimed: false };
    const refunds = refundsByTx.get(t.reference) ?? [];
    // Refunds that went through, or are on their way, no longer count as paid.
    const refunded = refunds.filter((r) => r.status !== "failed").reduce((s, r) => s + r.amount, 0);
    // The latest payment's details win (people sometimes fix a typo the second time).
    g.name = t.payer_name;
    g.phone = t.payer_phone ?? g.phone;
    g.details = parse(t.payer_details);
    g.paid += Number(t.amount) - refunded;
    g.refunded += refunded;
    g.payments.push({
      refunded,
      refunds,
      reference: t.reference,
      amount: Number(t.amount),
      paidAt: new Date(t.verified_at).toISOString(),
      method: t.payment_method ?? "BANK_TRANSFER",
      flagged: t.review_status !== "none",
    });
    groups.set(t.payer_key, g);
  }

  const expected = c.collection_type === "fixed" ? Number(c.fixed_amount) : null;
  const build = (g: Group | null, m: MemberRow | null): Contributor => {
    const paid = g?.paid ?? 0;
    const status: Contributor["status"] = paid <= 0 ? "unpaid" : expected && paid < expected ? "part" : "paid";
    const payments = (g?.payments ?? []).slice().reverse();
    return {
      key: m ? `m:${m.id}` : `p:${g!.key}`,
      name: m?.full_name ?? g!.name,
      status,
      paid,
      refunded: g?.refunded ?? 0,
      expected,
      outstanding: expected ? Math.max(0, expected - paid) : 0,
      details: g?.details ?? {},
      memberId: m?.member_id ?? null,
      phone: m?.phone ?? g?.phone ?? null,
      onList: Boolean(m),
      payments,
      lastPaid: payments[0]?.paidAt ?? null,
    };
  };

  const byName = new Map<string, Group[]>();
  for (const g of groups.values()) {
    const k = nameKey(g.name);
    byName.set(k, [...(byName.get(k) ?? []), g]);
  }

  const out: Contributor[] = [];
  for (const m of members) {
    let g = groups.get(m.member_key);
    if (g && g.claimed) g = undefined;
    if (!g) g = byName.get(m.name_key)?.find((x) => !x.claimed);
    if (g) g.claimed = true;
    out.push(build(g ?? null, m));
  }
  for (const g of groups.values()) if (!g.claimed) out.push(build(g, null));

  // Most recent payers first, then people who haven't paid (alphabetical).
  out.sort((a, b) => (b.lastPaid ?? "").localeCompare(a.lastPaid ?? "") || a.name.localeCompare(b.name));

  const summary: ContributorSummary = {
    people: out.length,
    paid: out.filter((x) => x.status === "paid").length,
    part: out.filter((x) => x.status === "part").length,
    unpaid: out.filter((x) => x.status === "unpaid").length,
    collected: out.reduce((s, x) => s + x.paid, 0),
    outstanding: out.reduce((s, x) => s + x.outstanding, 0),
    contributors: out.filter((x) => x.paid > 0).length,
    refunded: out.reduce((s, x) => s + x.refunded, 0),
  };
  return { contributors: out, summary };
}

/** Dashboard totals: unique contributors everywhere, and what's still owed on open fixed collections. */
export async function organiserOutstanding(organiserId: string) {
  const cols = await q<Pick<CollectionRow, "id" | "collection_type" | "fixed_amount" | "status">>(
    "select id, collection_type, fixed_amount, status from collections where organiser_id = $1",
    [organiserId],
  );
  let outstanding = 0;
  let contributors = 0;
  for (const c of cols) {
    const { summary } = await listContributors(c);
    contributors += summary.contributors;
    // Only open collections still expect money.
    if (c.collection_type === "fixed" && c.status === "active") outstanding += summary.outstanding;
  }
  return { outstanding, contributors };
}
