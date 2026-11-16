"use client";

import { type FormEvent, useState } from "react";
import Icon from "./Icon";
import { naira, type PaymentCheck } from "@/lib/data";
import { checkPaymentAction } from "@/app/actions/checkout";

const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" });

/** "Already paid? Check here": a contributor looks up their own payments by the ID they paid with. */
export default function CheckPayment({ slug, idLabel, defaultOpen = false }: { slug: string; idLabel: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PaymentCheck | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setResult(null);
    if (value.trim().length < 3) { setError(`Type your ${idLabel.toLowerCase()}.`); return; }
    setBusy(true);
    try {
      const r = await checkPaymentAction(slug, value);
      if (!r.ok) setError(r.error); else setResult(r.data);
    } catch { setError("We couldn’t reach Kolekt. Check your connection and try again."); }
    setBusy(false);
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-3xl border border-card bg-white p-4 text-left transition hover:border-accent">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-2xl bg-card text-primary"><Icon name="search" className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">Already paid? Check my payment</span>
          <span className="block text-xs text-muted">See what’s been received, your balance and your receipts.</span>
        </span>
        <Icon name="chevron" className="h-4 w-4 flex-none text-muted" />
      </button>
    );
  }

  const badge = result?.found
    ? { paid: ["Fully paid", "bg-[#2E9E6B]/12 text-[#23885A]"], contributed: ["Payment received", "bg-[#2E9E6B]/12 text-[#23885A]"], part: ["Part paid", "bg-[#E8A33D]/15 text-[#A86B12]"], unpaid: ["Not paid yet", "bg-[#C2344D]/10 text-[#C2344D]"] }[result.status]
    : null;

  return (
    <section className="rounded-3xl border border-card bg-white p-5" aria-label="Check my payment">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-extrabold">Check my payment</h2>
        <button type="button" onClick={() => { setOpen(false); setResult(null); setError(""); }} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-bg"><Icon name="x" className="h-4 w-4" /></button>
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{idLabel}</span>
          <input value={value} onChange={(e) => setValue(e.target.value)} maxLength={80} autoComplete="off" placeholder={`Your ${idLabel.toLowerCase()}`}
            className="h-12 w-full rounded-xl border border-card bg-bg px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
        </label>
        <button type="submit" disabled={busy} className="h-12 flex-none rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-70">
          {busy ? "Checking…" : "Check"}
        </button>
      </form>
      <p className="mt-1.5 text-[11px] text-muted">Use the same {idLabel.toLowerCase()} you typed when you paid.</p>

      {error && <p role="alert" className="mt-3 rounded-xl bg-[#C2344D]/8 p-3 text-xs font-medium text-[#C2344D]">{error}</p>}

      {result && !result.found && (
        <p role="status" className="mt-3 rounded-xl bg-bg p-3 text-xs font-medium leading-relaxed text-ink/80">{result.message}</p>
      )}

      {result?.found && badge && (
        <div role="status" className="reveal mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">{result.name}</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge[1]}`}>{badge[0]}</span>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-bg px-3.5 py-3"><dt className="text-[11px] font-semibold text-muted">Received</dt><dd className="mt-0.5 font-extrabold">{naira(result.paid)}</dd></div>
            {result.expected
              ? <div className="rounded-2xl bg-bg px-3.5 py-3"><dt className="text-[11px] font-semibold text-muted">Balance</dt><dd className={`mt-0.5 font-extrabold ${result.balance > 0 ? "text-[#C2344D]" : "text-[#23885A]"}`}>{result.balance > 0 ? naira(result.balance) : "Nothing owed ✓"}</dd></div>
              : <div className="rounded-2xl bg-bg px-3.5 py-3"><dt className="text-[11px] font-semibold text-muted">Payments</dt><dd className="mt-0.5 font-extrabold">{result.payments.length}</dd></div>}
          </dl>
          {result.refunded > 0 && <p className="rounded-xl bg-primary/10 p-3 text-xs font-medium text-primary">{naira(result.refunded)} was refunded to your bank account.</p>}
          {result.payments.length > 0 && (
            <ul className="divide-y divide-card rounded-2xl border border-card">
              {result.payments.map((p) => (
                <li key={p.reference} className="flex items-center gap-3 px-3.5 py-2.5">
                  <Icon name="check" className="h-4 w-4 flex-none text-[#23885A]" width={3} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{naira(p.amount)}{p.refunded > 0 && <span className="font-medium text-muted"> · {naira(p.refunded)} refunded</span>}</span>
                    <span className="block text-[11px] text-muted">{when(p.paidAt)} · verified by Paga</span>
                  </span>
                  <a href={`/receipt/${p.reference}`} target="_blank" rel="noreferrer" className="flex-none text-xs font-bold text-primary hover:underline">Receipt</a>
                </li>
              ))}
            </ul>
          )}
          {result.pending && (
            <a href={`/pay/${result.pending.reference}`} className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-accent p-3 text-xs">
              <span><b className="block text-sm text-ink">You have a payment waiting</b><span className="text-muted">{naira(result.pending.amount)} · transferred already? It may still be confirming.</span></span>
              <span className="flex-none font-bold text-primary">Open</span>
            </a>
          )}
          {result.payments.length === 0 && !result.pending && result.onList && (
            <p className="rounded-xl bg-bg p-3 text-xs text-muted">You’re on the organiser’s list, but no payment has been received from you yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
