import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { pagaMode } from "@/lib/server/paga";
import { settleTransaction } from "@/lib/server/payments";
import { getTransaction } from "@/lib/server/transactions";
import PayScreen from "./pay-screen";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Complete your payment · Kolekt", robots: { index: false } };

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { reference } = await params;
  const sp = await searchParams;
  let t = await getTransaction(reference);
  if (!t) notFound();

  // Back from Paga Checkout (?charge_reference=…&status_code=0). The query string proves nothing,
  // so confirm with Paga right away; settleTransaction only counts it if Paga's verify agrees.
  if (t.status === "pending" && sp.status_code === "0") {
    try {
      await settleTransaction(reference, { paymentMethod: "PAGA_CHECKOUT" });
      t = (await getTransaction(reference)) ?? t;
    } catch (e) {
      console.error("[pay] checkout return: settle failed", reference, e);
    }
  }
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
