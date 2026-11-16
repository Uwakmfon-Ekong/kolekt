import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import { naira } from "@/lib/data";
import { getTransaction } from "@/lib/server/transactions";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Receipt · Kolekt", robots: { index: false } };

/** Hide most of an ID or phone number on a receipt anyone with the link can open. */
function mask(s: string) {
  if (s.includes("@")) {
    const [u, d] = s.split("@");
    return `${u.slice(0, 2)}${"•".repeat(Math.max(2, u.length - 2))}@${d}`;
  }
  if (s.length <= 4) return "•".repeat(s.length);
  return s.slice(0, 3) + "•".repeat(Math.max(2, s.length - 6)) + s.slice(-3);
}

const fmt = (d: string | Date | null) =>
  d ? new Date(d).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }) : "—";

export default async function ReceiptPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const t = await getTransaction(reference);
  if (!t) notFound();
  if (t.status === "pending") redirect(`/pay/${reference}`);
  if (t.status !== "successful") notFound();

  // Show the contributor's other details, masked, except their name (shown in full above).
  const extras = Object.entries(t.payer_details)
    .filter(([k, v]) => k !== "Full Name" && v)
    .slice(0, 4)
    .map(([k, v]) => [k, /email|phone|matric|reg|member|id/i.test(k) ? mask(v) : v] as [string, string]);

  const rows: [string, string][] = [
    ["Paid by", t.payer_name],
    ...extras,
    ["For", t.title],
    ["Collected by", t.organisation || t.organiser_name],
    ["Date", fmt(t.verified_at)],
    ["Method", t.payment_method?.includes("USSD") ? "USSD via Paga" : "Bank transfer via Paga"],
    ...(t.collection_type === "fixed" && t.allow_part_payments && t.fixed_amount
      ? ([
          ["Paid so far", `${naira(Number(t.paid_to_date ?? t.amount))} of ${naira(Number(t.fixed_amount))}`],
          ["Balance", Number(t.paid_to_date ?? 0) >= Number(t.fixed_amount) ? "Fully paid ✓" : naira(Number(t.fixed_amount) - Number(t.paid_to_date ?? t.amount))],
        ] as [string, string][])
      : []),
    ["Kolekt reference", t.reference],
    ...(t.provider_reference ? [["Paga reference", t.provider_reference] as [string, string]] : []),
  ];

  return (
    <main className="min-h-screen bg-bg px-4 pb-12 pt-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-md">
        <article className="overflow-hidden rounded-[30px] border border-accent/35 bg-white shadow-soft print:border-0 print:shadow-none">
          <header className="flex items-center justify-between border-b border-dashed border-card px-6 py-5">
            <Logo size={32} />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2E9E6B]/12 px-3 py-1 text-xs font-bold text-[#23885A]">
              <Icon name="check" className="h-3.5 w-3.5" width={3} /> Verified payment
            </span>
          </header>
          <div className="px-6 pb-2 pt-7 text-center">
            <p className="text-sm font-medium text-muted">Amount paid</p>
            <p className="mt-1 text-[44px] font-extrabold leading-none tracking-tight">{naira(Number(t.amount))}</p>
          </div>
          <dl className="divide-y divide-card px-6 py-4 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-2.5">
                <dt className="shrink-0 text-muted">{k}</dt>
                <dd className="break-all text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="flex gap-2 border-t border-dashed border-card px-6 py-4 text-xs leading-relaxed text-muted">
            <Icon name="shield" className="h-4 w-4 flex-none text-primary" />
            <span>
              Kolekt confirmed this payment directly with Paga, not from a screenshot. Your organiser can see it against your name.
              {t.provider_mode === "mock" && " (Demo receipt: no real money was moved.)"}
            </span>
          </p>
        </article>
        <div className="mt-5 flex flex-wrap justify-center gap-3 print:hidden">
          <PrintButton />
          <Link href={`/c/${t.slug}`} className="inline-flex h-12 items-center px-4 text-sm font-semibold text-primary hover:underline">Back to collection</Link>
        </div>
      </div>
    </main>
  );
}
