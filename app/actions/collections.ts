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
  contributorFields: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
});

export type PublishedInfo = { id: string; publicCode: string; slug: string; link: string; name: string };

export async function publishCollectionAction(draft: z.input<typeof DraftSchema>): Promise<ActionResult<PublishedInfo>> {
  const me = await requireOrganiser();
  const parsed = DraftSchema.safeParse(draft);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  const amount = Number(d.amount || 0);
  const minimum = Number(d.minimum || 0);
  const target = Number(d.target || 0);
  if (d.type === "fixed" && !(amount >= 100)) return { ok: false, error: "The fixed amount must be at least ₦100." };
  if (d.type === "flexible" && minimum && target && minimum > target) return { ok: false, error: "The minimum contribution can’t be more than the target." };
  if (d.deadline) {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
    if (d.deadline < today) return { ok: false, error: "The deadline must be today or later." };
  }
  if (d.image && !d.image.startsWith("data:image/")) return { ok: false, error: "The cover must be an image." };

  const fieldsList = Array.from(new Set(["Full Name", ...d.contributorFields]));
  const base = slugify(d.name) || "collection";

  // Retry on the (very unlikely) chance a random slug or code is already taken.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = `${base}-${token(5)}`;
    const publicCode = `KLK-${token(8).toUpperCase()}`;
    try {
      const row = await one<{ id: string }>(
        `insert into collections
           (organiser_id, public_code, slug, title, description, organisation, cover_image, collection_type,
            fixed_amount, min_amount, target_amount, allow_above_target, deadline, contributor_fields)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         returning id`,
        [
          me.id, publicCode, slug, d.name, d.description, d.organisation, d.image ?? null, d.type,
          d.type === "fixed" ? amount : null,
          d.type === "flexible" && minimum ? minimum : null,
          target || null,
          d.allowAboveTarget,
          d.deadline || null,
          JSON.stringify(fieldsList),
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

export async function reopenCollectionAction(id: string): Promise<ActionResult> {
  const me = await requireOrganiser();
  const rows = await q("update collections set status = 'active' where id = $1 and organiser_id = $2 returning id", [id, me.id]);
  if (!rows.length) return { ok: false, error: "Collection not found." };
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
