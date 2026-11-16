"use server";

import { revalidatePath } from "next/cache";
import { q } from "@/lib/server/db";
import { requireOrganiser } from "@/lib/server/auth";
import { getOwnedCollection } from "@/lib/server/collections";
import { MAX_MEMBERS, parseRoster, saveRoster } from "@/lib/server/members";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function owned(collectionId: string) {
  const me = await requireOrganiser();
  return getOwnedCollection(me.id, String(collectionId));
}

/** Add people from pasted text or an uploaded CSV. Duplicates (same ID, or same name if no ID) are skipped. */
export async function saveRosterAction(collectionId: string, text: string, replace: boolean): Promise<Result<{ added: number; duplicates: number; skipped: number }>> {
  const c = await owned(collectionId);
  if (!c) return { ok: false, error: "Collection not found." };
  if (String(text).length > 400_000) return { ok: false, error: "That list is too long. Split it into smaller parts." };
  const { rows, skipped } = parseRoster(String(text ?? ""));
  if (!rows.length) return { ok: false, error: "We couldn’t find any names. Put one person per line, like: Blessing Etim, CSC/2021/014" };
  if (rows.length > MAX_MEMBERS) return { ok: false, error: `A list can have up to ${MAX_MEMBERS} people.` };
  const r = await saveRoster(c.id, rows, Boolean(replace));
  revalidatePath(`/collections/${c.id}`);
  revalidatePath(`/c/${c.slug}`);
  return { ok: true, data: { ...r, skipped } };
}

export async function removeMemberAction(collectionId: string, memberId: string): Promise<Result<null>> {
  const c = await owned(collectionId);
  if (!c) return { ok: false, error: "Collection not found." };
  await q("delete from collection_members where id = $1 and collection_id = $2", [String(memberId), c.id]);
  revalidatePath(`/collections/${c.id}`);
  return { ok: true, data: null };
}

export async function clearRosterAction(collectionId: string): Promise<Result<null>> {
  const c = await owned(collectionId);
  if (!c) return { ok: false, error: "Collection not found." };
  await q("delete from collection_members where collection_id = $1", [c.id]);
  revalidatePath(`/collections/${c.id}`);
  revalidatePath(`/c/${c.slug}`);
  return { ok: true, data: null };
}

export async function setPublicNamesAction(collectionId: string, show: boolean): Promise<Result<null>> {
  const c = await owned(collectionId);
  if (!c) return { ok: false, error: "Collection not found." };
  await q("update collections set show_public_names = $2 where id = $1", [c.id, Boolean(show)]);
  revalidatePath("/", "layout");
  return { ok: true, data: null };
}
