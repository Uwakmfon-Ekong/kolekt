"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { one, q } from "@/lib/server/db";
import { createSession, destroySession, hashPassword, requireOrganiser, verifyPassword } from "@/lib/server/auth";

export type AuthResult = { ok: false; error: string; field?: string } | { ok: true };

const SignupSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s()-]+$/, "Enter a valid phone number.")
    .refine((p) => { const d = p.replace(/\D/g, ""); return d.length >= 7 && d.length <= 15; }, "Enter a valid phone number."),
  password: z.string().min(8, "Password must be at least 8 characters.").regex(/\d/, "Password needs at least one number.").max(200),
  photo: z.string().max(400_000, "That photo is too large.").nullable().optional(),
});

export async function signupAction(input: z.input<typeof SignupSchema>): Promise<AuthResult> {
  const parsed = SignupSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: String(issue.path[0] ?? "") };
  }
  const { name, email, phone, password, photo } = parsed.data;
  if (photo && !photo.startsWith("data:image/")) return { ok: false, error: "Please choose an image file." };

  const exists = await one("select 1 from organisers where email = $1", [email]);
  if (exists) return { ok: false, error: "An account with this email already exists. Try logging in.", field: "email" };

  const organiser = await one<{ id: string }>(
    "insert into organisers (full_name, email, phone, photo, password_hash) values ($1,$2,$3,$4,$5) returning id",
    [name, email, phone, photo ?? null, await hashPassword(password)],
  );
  await createSession(organiser!.id);
  return { ok: true };
}

// Simple brute-force brake: after 8 wrong passwords for an email, wait 15 minutes.
type G = typeof globalThis & { __kolektLoginFails?: Map<string, { n: number; until: number }> };
const fails = ((globalThis as G).__kolektLoginFails ??= new Map());

export async function loginAction(input: { email: string; password: string; remember?: boolean }): Promise<AuthResult> {
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  if (!email || !password) return { ok: false, error: "Enter your email and password." };
  const f = fails.get(email);
  if (f && f.n >= 8 && f.until > Date.now()) return { ok: false, error: "Too many attempts. Please wait 15 minutes and try again." };

  const organiser = await one<{ id: string; password_hash: string }>("select id, password_hash from organisers where email = $1", [email]);
  // Same message either way, so the form can't be used to find out who has an account.
  if (!organiser || !(await verifyPassword(password, organiser.password_hash))) {
    const prev = fails.get(email);
    const n = prev && prev.until > Date.now() ? prev.n + 1 : 1;
    fails.set(email, { n, until: Date.now() + 15 * 60 * 1000 });
    return { ok: false, error: "That email and password don’t match an account." };
  }
  fails.delete(email);
  await createSession(organiser.id, input.remember !== false);
  return { ok: true };
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const ProfileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  phone: z.string().trim().max(20).optional(),
});

export async function updateProfileAction(input: z.input<typeof ProfileSchema>): Promise<AuthResult> {
  const me = await requireOrganiser();
  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await q("update organisers set full_name = $2, phone = $3 where id = $1", [me.id, parsed.data.name, parsed.data.phone || null]);
  return { ok: true };
}
