import { getOrganiser } from "@/lib/server/auth";
import { fields, getOwnedCollection, listContributions } from "@/lib/server/collections";
import { listContributors } from "@/lib/server/contributors";
import { buildXlsx, type Cell } from "@/lib/server/xlsx";
import { methodLabel } from "@/lib/data";

const csvCell = (v: Cell) => {
  const s = String(v ?? "");
  // Quote everything; neutralise spreadsheet formulas.
  return `"${(/^[=+\-@]/.test(s) ? "'" + s : s).replace(/"/g, '""')}"`;
};
/** Text cells that look like formulas are neutralised in Excel too. */
const safe = (v: Cell): Cell => (typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v);

const STATUS = { paid: "Fully paid", part: "Part paid", unpaid: "Not paid" } as const;

/**
 * Exports for a collection.
 *   ?view=payments (default)  every verified payment
 *   ?view=contributors        one row per person, with balance (includes unpaid class-list members)
 *   &format=csv (default) | xlsx
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getOrganiser();
  if (!me) return new Response("Please log in.", { status: 401 });
  const { id } = await ctx.params;
  const c = await getOwnedCollection(me.id, id);
  if (!c) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const view = url.searchParams.get("view") === "contributors" ? "contributors" : "payments";
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const cols = fields(c);
  const fmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });
  const fixed = c.collection_type === "fixed";

  let header: string[];
  let rows: Cell[][];
  if (view === "payments") {
    const list = await listContributions(c.id, 100_000);
    header = [...cols, "Amount (NGN)", "Paid at (Lagos)", "Method", "Reference", "Flag"];
    rows = list.map((r) => [
      ...cols.map((f) => r.details[f] ?? (f === "Full Name" ? r.name : "")),
      r.amount, fmt.format(new Date(r.paidAt)), methodLabel(r.method), r.reference, r.flagged ? "Paid twice" : "",
    ]);
  } else {
    const { contributors } = await listContributors(c);
    const extra = cols.filter((f) => f !== "Full Name");
    header = ["Full Name", ...extra, "Status", "Paid (NGN)", ...(fixed ? ["Expected (NGN)", "Balance (NGN)"] : []), "Payments", "Last paid (Lagos)", "On class list", "References"];
    rows = contributors.map((p) => [
      p.name,
      ...extra.map((f) => (/matric|reg|\bid\b/i.test(f) && p.memberId) || p.details[f] || (/phone/i.test(f) ? p.phone ?? "" : "")),
      fixed ? STATUS[p.status] : p.paid > 0 ? "Contributed" : "Not paid",
      p.paid,
      ...(fixed ? [p.expected ?? 0, p.outstanding] : []),
      p.payments.length,
      p.lastPaid ? fmt.format(new Date(p.lastPaid)) : "",
      p.onList ? "Yes" : "No",
      p.payments.map((x) => x.reference).join(" "),
    ]);
  }

  const name = `${c.slug}-${view}.${format}`;
  const headers = { "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" };
  if (format === "xlsx") {
    const widths = header.map((h, i) => Math.min(40, Math.max(h.length + 4, ...rows.slice(0, 200).map((r) => String(r[i] ?? "").length + 2))));
    const body = buildXlsx(c.title, header, rows.map((r) => r.map(safe)), widths);
    return new Response(body as unknown as BodyInit, { headers: { ...headers, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } });
  }
  const lines = [header.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))];
  return new Response("﻿" + lines.join("\r\n"), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" } });
}
