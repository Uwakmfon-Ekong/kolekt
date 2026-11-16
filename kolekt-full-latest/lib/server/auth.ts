import "server-only";
import { randomBytes, scrypt as _scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one, q } from "./db";

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "kolekt_session";
const SESSION_DAYS = 14;

export type Organiser = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  photo: string | null;
  payout_bank_name: string | null;
  payout_account_number: string | null;
  payout_account_name: string | null;
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [, saltHex, keyHex] = stored.split("$");
  if (!saltHex || !keyHex) return false;
  const key = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(keyHex, "hex");
  return expected.length === key.length && timingSafeEqual(expected, key);
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Session tokens are random; only their SHA-256 is stored, so a database leak can't be replayed. */
export async function createSession(organiserId: string, remember = true) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await q("insert into sessions (token_hash, organiser_id, expires_at) values ($1,$2,$3)", [
    sha256(token),
    organiserId,
    expires.toISOString(),
  ]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Without "remember me" the cookie ends with the browser session.
    ...(remember ? { expires } : {}),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await q("delete from sessions where token_hash = $1", [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

export async function getOrganiser(): Promise<Organiser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return one<Organiser>(
    `select o.id, o.full_name, o.email, o.phone, o.photo, o.payout_bank_name, o.payout_account_number, o.payout_account_name
       from sessions s join organisers o on o.id = s.organiser_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [sha256(token)],
  );
}

export async function requireOrganiser(): Promise<Organiser> {
  const organiser = await getOrganiser();
  if (!organiser) {
    // A cookie that no longer matches a session must be cleared, or the middleware would
    // keep bouncing between /login and /dashboard. Server components can't delete cookies,
    // so a route handler does it.
    const stale = Boolean((await cookies()).get(SESSION_COOKIE)?.value);
    redirect(stale ? "/api/auth/signout" : "/login");
  }
  return organiser;
}
