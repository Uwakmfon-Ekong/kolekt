import "server-only";
import { one, q } from "./db";
import { dateStr } from "./utils";
import type { Activity, Collection, Contribution, Stats } from "../data";
import { organiserOutstanding } from "./contributors";
import { listNotices } from "./notifications";

export type CollectionRow = {
  id: string;
  organiser_id: string;
  public_code: string;
  slug: string;
  title: string;
  description: string;
  organisation: string;
  cover_image: string | null;
  collection_type: "fixed" | "flexible";
  fixed_amount: number | null;
  min_amount: number | null;
  target_amount: number | null;
  allow_above_target: boolean;
  deadline: string | Date | null;
  contributor_fields: string[] | string;
  status: "active" | "closed";
  show_public_names?: boolean;
  allow_part_payments?: boolean;
  optional_fields?: string[] | string | null;
  created_at: string | Date;
  organiser_name?: string;
  collected?: number;
  contributors?: number;
};

const naira = (n: number) => "₦" + Number(n || 0).toLocaleString("en-NG");

/** Deadlines are whole days in Lagos time. */
function daysLeft(deadline: string) {
  const end = new Date(`${deadline}T23:59:59+01:00`).getTime();
  return Math.ceil((end - Date.now()) / 864e5) - 1;
}

export function isOpen(c: Pick<CollectionRow, "status" | "deadline">) {
  if (c.status !== "active") return false;
  const d = dateStr(c.deadline);
  return !d || daysLeft(d) >= 0;
}

function iconFor(title: string, organisation: string): Collection["icon"] {
  const t = `${title} ${organisation}`.toLowerCase();
  if (/church|chapel|parish|mosque|fellowship|choir|harvest|ministry/.test(t)) return "church";
  if (/dues|department|faculty|class|level|school|levy|student|course|exam|matric/.test(t)) return "school";
  if (/outreach|charity|welfare|donat|support|relief|community|wedding|birthday|gift/.test(t)) return "heart";
  return "wallet";
}

export const fields = (c: Pick<CollectionRow, "contributor_fields">): string[] => {
  const f = typeof c.contributor_fields === "string" ? JSON.parse(c.contributor_fields) : c.contributor_fields;
  return Array.isArray(f) && f.length ? f.map(String) : ["Full Name"];
};

/** Fields the contributor may leave empty. Full Name is always required. */
export const optionalFields = (c: Pick<CollectionRow, "optional_fields">): string[] => {
  const f = typeof c.optional_fields === "string" ? JSON.parse(c.optional_fields) : c.optional_fields;
  return Array.isArray(f) ? f.map(String).filter((x) => x !== "Full Name") : [];
};

export function toCollection(c: CollectionRow, baseUrl: string): Collection {
  const deadline = dateStr(c.deadline);
  const open = isOpen(c);
  const left = deadline ? daysLeft(deadline) : null;
  const due = !open
    ? "Closed"
    : left === null
      ? "No deadline"
      : left === 0
        ? "Ends today"
        : `Due in ${left} day${left === 1 ? "" : "s"}`;
  const fixed = c.collection_type === "fixed";
  const link = `${baseUrl}/c/${c.slug}`;
  const collected = Number(c.collected ?? 0);
  const target = Number(c.target_amount ?? 0);
  return {
    id: c.id,
    name: c.title,
    icon: iconFor(c.title, c.organisation),
    collected,
    target,
    status: open ? "Active" : "Completed",
    due,
    note: open ? (target && collected >= target ? "Target reached 🎉" : due) : undefined,
    organisation: c.organisation,
    description: c.description,
    contribution: fixed ? `Fixed · ${naira(Number(c.fixed_amount))} per person${c.allow_part_payments ? " (part payments allowed)" : ""}` : "Flexible · contributors choose an amount",
    url: link.replace(/^https?:\/\//, ""),
    link,
    slug: c.slug,
    image: c.cover_image,
    organiserName: c.organiser_name,
    contributionType: c.collection_type,
    contributionAmount: fixed ? Number(c.fixed_amount) : undefined,
    minimumContribution: !fixed && c.min_amount ? Number(c.min_amount) : undefined,
    deadline: deadline || undefined,
    allowAboveTarget: c.allow_above_target,
    contributorFields: fields(c),
    collectionId: c.public_code,
    publicationStatus: c.status === "active" ? "ACTIVE" : "CLOSED",
    contributors: Number(c.contributors ?? 0),
    createdAt: new Date(c.created_at).toISOString(),
    showPublicNames: c.show_public_names !== false,
    allowPartPayments: fixed && Boolean(c.allow_part_payments),
    optionalFields: optionalFields(c),
  };
}

const WITH_TOTALS = /* sql */ `
  select c.*, o.full_name as organiser_name,
         coalesce(t.collected, 0) as collected, coalesce(t.contributors, 0) as contributors
    from collections c
    join organisers o on o.id = c.organiser_id
    left join lateral (
      select sum(amount) as collected, count(*)::int as contributors
        from transactions where collection_id = c.id and status = 'successful'
    ) t on true`;

export async function listCollections(organiserId: string, baseUrl: string) {
  const rows = await q<CollectionRow>(`${WITH_TOTALS} where c.organiser_id = $1 order by c.created_at desc`, [organiserId]);
  return rows.map((r) => toCollection(r, baseUrl));
}

export async function getCollectionBySlug(slug: string) {
  return one<CollectionRow>(`${WITH_TOTALS} where c.slug = $1`, [slug]);
}

export async function getOwnedCollection(organiserId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return one<CollectionRow>(`${WITH_TOTALS} where c.id = $1 and c.organiser_id = $2`, [id, organiserId]);
}

type TxRow = {
  reference: string;
  payer_name: string;
  amount: number;
  verified_at: string | Date;
  payment_method: string | null;
  payer_details: Record<string, string> | string;
  review_status: string;
};

export async function listContributions(collectionId: string, limit = 500): Promise<Contribution[]> {
  const rows = await q<TxRow>(
    `select reference, payer_name, amount, verified_at, payment_method, payer_details, review_status
       from transactions where collection_id = $1 and status = 'successful'
      order by verified_at desc limit $2`,
    [collectionId, limit],
  );
  return rows.map((r) => ({
    reference: r.reference,
    name: r.payer_name,
    amount: Number(r.amount),
    paidAt: new Date(r.verified_at).toISOString(),
    method: r.payment_method ?? "BANK_TRANSFER",
    details: typeof r.payer_details === "string" ? JSON.parse(r.payer_details) : r.payer_details,
    flagged: r.review_status !== "none",
  }));
}

export async function organiserStats(organiserId: string): Promise<Stats> {
  const r = await one<{ total: number | null; week: number | null; n: number }>(
    `select sum(t.amount) as total,
            sum(t.amount) filter (where t.verified_at > now() - interval '7 days') as week,
            count(*)::int as n
       from transactions t join collections c on c.id = t.collection_id
      where c.organiser_id = $1 and t.status = 'successful'`,
    [organiserId],
  );
  const p = await one<{ out: number | null }>("select sum(amount) as out from payouts where organiser_id = $1 and status = 'successful'", [organiserId]);
  const o = await organiserOutstanding(organiserId);
  return { totalCollected: Number(r?.total ?? 0), thisWeek: Number(r?.week ?? 0), contributions: r?.n ?? 0, paidOut: Number(p?.out ?? 0), ...o };
}

export async function recentActivity(organiserId: string): Promise<Activity[]> {
  const notices = await listNotices(organiserId, 6);
  return notices.map((n) => ({ id: n.id, text: n.text, at: n.at, href: n.href }));
}
