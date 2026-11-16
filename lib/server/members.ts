import "server-only";
import { getDb, q } from "./db";
import { normalizeIdentifier } from "./utils";
import type { Member, MemberStatus } from "../data";

export const MAX_MEMBERS = 2000;

/** "Blessing Etim" and "BLESSING  ETIM." both become "BLESSINGETIM". Must match nameKeySql. */
export const nameKey = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
const nameKeySql = (col: string) => `upper(regexp_replace(${col}, '[^A-Za-z0-9]', '', 'g'))`;

export type RosterRow = { name: string; id: string | null; phone: string | null };

const looksLikePhone = (s: string) => {
  const d = s.replace(/[\s()+-]/g, "");
  return /^\d{10,14}$/.test(d) && /^(0|234)/.test(d);
};
const looksLikeId = (s: string) => /\d/.test(s) && !looksLikePhone(s) && s.length <= 40;
const looksLikeName = (s: string) => /[a-z]/i.test(s) && !/\d{3,}/.test(s);

/**
 * Turns a pasted class list into rows. Accepts one person per line, with columns separated by
 * commas, tabs, semicolons or pipes, in any order: "Blessing Etim, CSC/2021/014, 08031234567".
 * A header row ("Name, Matric No, Phone") is skipped. Spreadsheet copy-paste uses tabs, so that works too.
 */
export function parseRoster(text: string): { rows: RosterRow[]; skipped: number } {
  const rows: RosterRow[] = [];
  let skipped = 0;
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  lines.forEach((line, i) => {
    const cells = line.split(/\t|,|;|\|/).map((c) => c.trim().replace(/^"|"$/g, "")).filter(Boolean);
    if (!cells.length) return;
    if (i === 0 && cells.some((c) => /^(s\/?n|no\.?|name|full ?name|matric|reg|phone|id)\b/i.test(c)) && !cells.some((c) => looksLikeId(c) || looksLikePhone(c))) return;
    const cleaned = cells.filter((c) => !/^\d{1,3}\.?$/.test(c)); // drop serial numbers like "1" or "12."
    const phone = cleaned.find(looksLikePhone) ?? null;
    const id = cleaned.find((c) => c !== phone && looksLikeId(c)) ?? null;
    const name = cleaned.filter((c) => c !== phone && c !== id && looksLikeName(c)).join(" ").replace(/\s+/g, " ").trim();
    if (name.length < 2) { skipped++; return; }
    rows.push({ name: name.slice(0, 80), id: id ? id.slice(0, 40) : null, phone: phone ? phone.replace(/[\s()-]/g, "") : null });
  });
  return { rows, skipped };
}

export async function saveRoster(collectionId: string, rows: RosterRow[], replace: boolean) {
  const db = await getDb();
  return db.tx(async (tx) => {
    if (replace) await tx.query("delete from collection_members where collection_id = $1", [collectionId]);
    const [{ n }] = await tx.query<{ n: number }>("select count(*)::int as n from collection_members where collection_id = $1", [collectionId]);
    let added = 0;
    let duplicates = 0;
    for (const r of rows) {
      if (n + added >= MAX_MEMBERS) break;
      // The ID is what identifies a person; without one, the name does.
      const key = normalizeIdentifier(r.id || r.name);
      const res = await tx.query<{ id: string }>(
        `insert into collection_members (collection_id, full_name, member_id, phone, member_key, name_key)
         values ($1,$2,$3,$4,$5,$6)
         on conflict (collection_id, member_key) do nothing returning id`,
        [collectionId, r.name, r.id, r.phone, key, nameKey(r.name)],
      );
      if (res.length) added++;
      else duplicates++;
    }
    return { added, duplicates };
  });
}

/**
 * Everyone on the list, with what they've paid. A payment counts for a member when the
 * contributor's ID (matric/reg/phone/email, normalised) matches, or failing that, their name.
 */
export async function memberStatus(collectionId: string, fixedAmount: number | null): Promise<MemberStatus> {
  const rows = await q<{ id: string; full_name: string; member_id: string | null; phone: string | null; total: number | null; last_paid: string | Date | null }>(
    `select m.id, m.full_name, m.member_id, m.phone, p.total, p.last_paid
       from collection_members m
       left join lateral (
         select sum(t.amount - coalesce((select sum(p.amount) from payouts p
                                          where p.transaction_reference = t.reference and p.kind = 'refund' and p.status <> 'failed'), 0)) as total,
                max(t.verified_at) as last_paid
           from transactions t
          where t.collection_id = m.collection_id and t.status = 'successful'
            and (t.payer_key = m.member_key or ${nameKeySql("t.payer_name")} = m.name_key)
       ) p on true
      where m.collection_id = $1
      order by m.full_name`,
    [collectionId],
  );
  const members: Member[] = rows.map((r) => {
    const paid = Number(r.total ?? 0);
    return {
      id: r.id,
      name: r.full_name,
      memberId: r.member_id,
      phone: r.phone,
      paid,
      // On a fixed collection someone who paid less (e.g. a partial transfer) still owes.
      status: paid <= 0 ? "unpaid" : fixedAmount && paid < fixedAmount ? "part" : "paid",
      lastPaid: r.last_paid ? new Date(r.last_paid).toISOString() : null,
    };
  });

  // Verified contributors who don't match anyone on the list.
  const strangers = members.length
    ? await q<{ payer_name: string; total: number; last_paid: string | Date }>(
        `select t.payer_name, sum(t.amount) as total, max(t.verified_at) as last_paid
           from transactions t
          where t.collection_id = $1 and t.status = 'successful'
            and not exists (
              select 1 from collection_members m
               where m.collection_id = t.collection_id
                 and (m.member_key = t.payer_key or m.name_key = ${nameKeySql("t.payer_name")}))
          group by t.payer_key, t.payer_name
          order by max(t.verified_at) desc`,
        [collectionId],
      )
    : [];

  return {
    members,
    notOnList: strangers.map((s) => ({ name: s.payer_name, paid: Number(s.total), lastPaid: new Date(s.last_paid).toISOString() })),
  };
}

/** For the public page: how many on the list have paid. */
export async function rosterProgress(collectionId: string): Promise<{ total: number; paid: number } | null> {
  const [r] = await q<{ total: number; paid: number }>(
    `select count(*)::int as total,
            count(*) filter (where exists (
              select 1 from transactions t
               where t.collection_id = m.collection_id and t.status = 'successful'
                 and (t.payer_key = m.member_key or ${nameKeySql("t.payer_name")} = m.name_key)))::int as paid
       from collection_members m where m.collection_id = $1`,
    [collectionId],
  );
  return r && r.total > 0 ? { total: r.total, paid: r.paid } : null;
}

/** First name + last initial ("Blessing E."), newest first. Amounts are never shown publicly. */
export async function publicSupporters(collectionId: string, limit = 12) {
  const rows = await q<{ payer_name: string; verified_at: string | Date }>(
    `select payer_name, max(verified_at) as verified_at from transactions
      where collection_id = $1 and status = 'successful'
      group by payer_key, payer_name order by max(verified_at) desc limit $2`,
    [collectionId, limit],
  );
  return rows.map((r) => {
    const parts = r.payer_name.trim().split(/\s+/);
    const first = parts[0] ?? "";
    const initial = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "";
    return { name: first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() + initial, at: new Date(r.verified_at).toISOString() };
  });
}
