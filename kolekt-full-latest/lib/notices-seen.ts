/** When the organiser last read their notifications (ISO time), kept in this browser. */
export const NOTICES_SEEN_KEY = "kolekt-notices-seen-at";

export function readSeen(): string {
  try { return localStorage.getItem(NOTICES_SEEN_KEY) ?? ""; } catch { return ""; }
}

/** Marks everything up to `at` (default: now) as read and tells other parts of the page. */
export function writeSeen(at?: string): string {
  const v = at && at > new Date().toISOString() ? at : new Date().toISOString();
  try { localStorage.setItem(NOTICES_SEEN_KEY, v); } catch { /* storage unavailable */ }
  try { window.dispatchEvent(new Event("kolekt-notices-seen")); } catch { /* not in a browser */ }
  return v;
}
