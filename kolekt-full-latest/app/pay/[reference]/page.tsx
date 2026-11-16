import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { pagaMode } from "@/lib/server/paga";
import { getTransaction } from "@/lib/server/transactions";
import PayScreen from "./pay-screen";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Complete your payment · Kolekt", robots: { index: false } };

export default async function PayPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const t = await getTransaction(reference);
  if (!t) notFound();
  if (t.status === "successful") redirect(`/receipt/${reference}`);

  const i = t.payment_instructions;
  const expired = t.status === "expired" || (t.expires_at ? new Date(t.expires_at) < new Date() : false);

  return (
    <main className="min-h-screen bg-bg px-4 pb-12 pt-5 sm:px-6">
      <div className="mx-auto max-w-md">
        <header className="flex items-center justify-between">
          <Logo size={34} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary ring-1 ring-card">Secure payment</span>
        </header>
        <div className="mt-6">
          <p className="text-sm font-medium text-muted">{t.organisation || t.organiser_name}</p>
          <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight">{t.title}</h1>
        </div>
        <PayScreen
          reference={t.reference}
          slug={t.slug}
          payerName={t.payer_name}
          amount={Number(i?.amountToPay ?? t.amount_to_pay ?? t.amount)}
          instructions={i}
          initialStatus={expired && t.status === "pending" ? "expired" : t.status}
          mode={pagaMode()}
        />
      </div>
    </main>
  );
}
