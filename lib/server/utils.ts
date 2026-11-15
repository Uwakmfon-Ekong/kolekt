import "server-only";
import { randomBytes } from "node:crypto";

/** Postgres `date` columns come back as Date or string depending on the driver; normalise to YYYY-MM-DD. */
export function dateStr(d: string | Date | null | undefined) {
  if (!d) return "";
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Unambiguous random token (no 0/O/1/l). */
export function token(length: number) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(length), (b) => chars[b % chars.length]).join("");
}

/**
 * IDs are typed many ways: "csc/2021/014" vs "CSC 2021 014", "+234 803 123 4567" vs "08031234567".
 * Normalise so they all match.
 */
export function normalizeIdentifier(s: string) {
  const n = s.toUpperCase().replace(/[^A-Z0-9@.]/g, "");
  return /^234\d{10}$/.test(n) ? "0" + n.slice(3) : n;
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
export const phoneDigits = (s: string) => s.replace(/\D/g, "");
export const isPhone = (s: string) => {
  const d = phoneDigits(s);
  return d.length >= 10 && d.length <= 14;
};
