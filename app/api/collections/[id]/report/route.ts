import { getOrganiser } from "@/lib/server/auth";
import { fields, getOwnedCollection, listContributions } from "@/lib/server/collections";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  // Quote everything; neutralise spreadsheet formulas.
  return `"${(/^[=+\-@]/.test(s) ? "'" + s : s).replace(/"/g, '""')}"`;
};

/** CSV of every verified contribution, with the details each contributor filled in. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getOrganiser();
  if (!me) return new Response("Please log in.", { status: 401 });
  const { id } = await ctx.params;
  const c = await getOwnedCollection(me.id, id);
  if (!c) return new Response("Not found", { status: 404 });

  const cols = fields(c);
  const rows = await listContributions(c.id, 100_000);
  const header = [...cols, "Amount (NGN)", "Paid at (Lagos)", "Method", "Reference", "Flag"];
  const fmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });
  const lines = [
    header.map(cell).join(","),
    ...rows.map((r) =>
      [...cols.map((f) => r.details[f] ?? (f === "Full Name" ? r.name : "")), r.amount, fmt.format(new Date(r.paidAt)), r.method, r.reference, r.flagged ? "Paid twice" : ""]
        .map(cell)
        .join(","),
    ),
  ];
  const name = `${c.slug}-contributions.csv`;
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
