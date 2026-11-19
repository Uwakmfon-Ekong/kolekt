"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { one, q } from "@/lib/server/db";
import { requireOrganiser } from "@/lib/server/auth";
import { appUrl } from "@/lib/server/app-url";
import { slugify, token } from "@/lib/server/utils";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const digits = z.string().trim().regex(/^\d*$/, "Use numbers only.").default("");

const DraftSchema = z.object({
  name: z.string().trim().min(3, "Collection name should be at least 3 characters.").max(80),
  description: z.string().trim().min(10, "Description should be at least 10 characters.").max(600),
  organisation: z.string().trim().min(1, "Add the organisation name.").max(80),
  image: z.string().max(600_000, "That cover image is too large. Try a smaller one.").nullable().optional(),
  type: z.enum(["fixed", "flexible"], { message: "Choose a contribution type." }),
  amount: digits,
  minimum: digits,
  target: digits,
  deadline: z.string().trim().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Choose a valid deadline.").default(""),
  allowAboveTarget: z.boolean().default(false),
  allowPartPayments: z.boolean().default(false),
  contributorFields: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
  optionalFields: z.array(z.string().trim().max(40)).max(12).default([]),
});

export type PublishedInfo = { id: string; publicCode: string; slug: string; link: string; name: string };

export async function publishCollectionAction(draft: z.input<typeof DraftSchema>): Promise<ActionResult<PublishedInfo>> {
  const me = await requireOrganiser();
  const parsed = DraftSchema.safeParse(draft);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  // Only the fields for the chosen type count. The wizard keeps the other type's values in the
  // draft (e.g. a target typed before switching to Fixed), and they must not be saved.
  const flexible = d.type === "flexible";
  const amount = flexible ? 0 : Number(d.amount || 0);
  const minimum = flexible ? Number(d.minimum || 0) : 0;
  const target = flexible ? Number(d.target || 0) : 0;
  if (!flexible && !(amount >= 100)) return { ok: false, error: "The fixed amount must be at least ₦100." };
  if (minimum && minimum < 100) return { ok: false, error: "The minimum contribution must be at least ₦100." };
  if (minimum && target && minimum > target) return { ok: false, error: "The minimum contribution can’t be more than the target." };
  if (d.deadline) {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
    if (d.deadline < today) return { ok: false, error: "The deadline must be today or later." };
  }
  if (d.image && !d.image.startsWith("data:image/")) return { ok: false, error: "The cover must be an image." };

  const fieldsList = Array.from(new Set(["Full Name", ...d.contributorFields]));
  const optional = d.optionalFields.filter((f) => f !== "Full Name" && fieldsList.includes(f));
  const base = slugify(d.name) || "collection";

  // Retry on the (very unlikely) chance a random slug or code is already taken.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = `${base}-${token(5)}`;
    const publicCode = `KLK-${token(8).toUpperCase()}`;
    try {
      const row = await one<{ id: string }>(
        `insert into collections
           (organiser_id, public_code, slug, title, description, organisation, cover_image, collection_type,
            fixed_amount, min_amount, target_amount, allow_above_target, deadline, contributor_fields,
            allow_part_payments, optional_fields)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         returning id`,
        [
          me.id, publicCode, slug, d.name, d.description, d.organisation, d.image ?? null, d.type,
          flexible ? null : amount,
          minimum || null,
          target || null,
          // Only meaningful with a target. Without one there is no cap, so keep the permissive default.
          target ? d.allowAboveTarget : true,
          d.deadline || null,
          JSON.stringify(fieldsList),
          d.type === "fixed" && d.allowPartPayments,
          JSON.stringify(optional),
        ],
      );
      revalidatePath("/", "layout");
      return { ok: true, data: { id: row!.id, publicCode, slug, link: `${await appUrl()}/c/${slug}`, name: d.name } };
    } catch (e) {
      if (String(e).includes("duplicate key") && attempt < 4) continue;
      console.error("[collections] publish failed", e);
      return { ok: false, error: "We couldn’t publish your collection. Please try again." };
    }
  }
  return { ok: false, error: "We couldn’t publish your collection. Please try again." };
}

const EditSchema = z.object({
  name: z.string().trim().min(3, "Name should be at least 3 characters.").max(80),
  description: z.string().trim().min(10, "Description should be at least 10 characters.").max(600),
});

export async function updateCollectionAction(id: string, patch: z.input<typeof EditSchema>): Promise<ActionResult> {
  const me = await requireOrganiser();
  const parsed = EditSchema.safeParse(patch);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const rows = await q("update collections set title = $3, description = $4 where id = $1 and organiser_id = $2 returning id", [
    id, me.id, parsed.data.name, parsed.data.description,
  ]);
  if (!rows.length) return { ok: false, error: "Collection not found." };
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

export async function closeCollectionAction(id: string): Promise<ActionResult> {
  const me = await requireOrganiser();
  const rows = await q("update collections set status = 'closed' where id = $1 and organiser_id = $2 returning id", [id, me.id]);
  if (!rows.length) return { ok: false, error: "Collection not found." };
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

/**
 * Reopen a closed collection. A collection also closes on its own once its deadline passes,
 * so a past deadline is cleared here; otherwise it would stay closed after "reopening".
 */
export async function reopenCollectionAction(id: string): Promise<ActionResult> {
  const me = await requireOrganiser();
  const rows = await q(
    `update collections
        set status = 'active',
            deadline = case when deadline < (now() at time zone 'Africa/Lagos')::date then null else deadline end
      where id = $1 and organiser_id = $2 returning id`,
    [id, me.id],
  );
  if (!rows.length) return { ok: false, error: "Collection not found." };
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

/** Delete a collection. Only allowed before any money has been received, so no payment record is ever lost. */
export async function deleteCollectionAction(id: string): Promise<ActionResult> {
  const me = await requireOrganiser();
  if (!/^[0-9a-f-]{36}$/i.test(String(id))) return { ok: false, error: "Collection not found." };
  const c = await one<{ paid: number; payouts: number }>(
    `select (select count(*)::int from transactions t where t.collection_id = c.id and t.status = 'successful') as paid,
            (select count(*)::int from payouts p where p.collection_id = c.id) as payouts
       from collections c where c.id = $1 and c.organiser_id = $2`,
    [id, me.id],
  );
  if (!c) return { ok: false, error: "Collection not found." };
  if (c.paid > 0 || c.payouts > 0)
    return { ok: false, error: "This collection has received payments, so it can’t be deleted (the records must be kept). Close it instead." };
  await q("delete from collections where id = $1 and organiser_id = $2", [id, me.id]);
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
