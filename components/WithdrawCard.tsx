"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import Icon from "./Icon";
import { maskAccount, naira, timeAgo, type Balance, type PayoutAccount, type PayoutView } from "@/lib/data";
import { refreshPayoutAction, withdrawAction } from "@/app/actions/payouts";
import { useApp } from "@/lib/create-collection";

const statusStyle: Record<PayoutView["status"], string> = {
  successful: "bg-[#2E9E6B]/12 text-[#23885A]",
  processing: "bg-[#E8A33D]/15 text-[#A86B12]",
  failed: "bg-[#C2344D]/10 text-[#C2344D]",
};
const statusLabel: Record<PayoutView["status"], string> = { successful: "Paid", processing: "Processing", failed: "Failed" };

/** Withdraw a collection's balance to the organiser's verified bank account (Paga Business API). */
export default function WithdrawCard({ collectionId, balance, payouts, account }: {
  collectionId: string; balance: Balance; payouts: PayoutView[]; account: PayoutAccount | null | undefined;
}) {
  const { refresh } = useApp();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<PayoutView | null>(null);
  const [checking, setChecking] = useState<string | null>(null);

  const start = () => { setAmount(String(Math.floor(balance.available))); setError(""); setDone(null); setOpen(true); };
  const withdraw = async () => {
    const n = Number(amount);
    setError("");
    if (!(n >= 100)) return setError("The minimum withdrawal is ₦100.");
    if (n > balance.available) return setError(`You can withdraw up to ${naira(balance.available)}.`);
    setBusy(true);
    const r = await withdrawAction(collectionId, n);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setDone(r.data); setOpen(false); refresh();
  };
  const check = async (ref: string) => { setChecking(ref); await refreshPayoutAction(ref); setChecking(null); refresh(); };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold">Withdraw</h2>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted"><Icon name="shield" className="h-3.5 w-3.5 text-primary" /> Paid out by Paga</span>
      </div>
      <p className="mt-3 text-xs font-semibold text-muted">Available to withdraw</p>
      <p className="mt-0.5 text-[26px] font-extrabold tracking-tight">{naira(balance.available)}</p>
      {(balance.paidOut > 0 || balance.processing > 0) && (
        <p className="mt-0.5 text-xs text-muted">
          {naira(balance.paidOut)} paid out{balance.processing > 0 ? ` · ${naira(balance.processing)} processing` : ""}
        </p>
      )}

      {done && (
        <p role="status" className="mt-3 flex gap-2 rounded-2xl bg-[#2E9E6B]/8 p-3 text-xs font-medium leading-relaxed">
          <Icon name="check" className="h-4 w-4 flex-none text-[#23885A]" width={2.6} />
          <span>{done.status === "successful" ? `${naira(done.amount)} sent to ${done.bankName} ${maskAccount(done.accountNumber)}.` : `${naira(done.amount)} is on its way. We’ll confirm with Paga.`}</span>
        </p>
      )}

      {!account ? (
        <Link href="/profile" className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-accent bg-card/50 p-3.5 text-sm font-semibold text-primary hover:bg-card">
          Add a payout bank account <Icon name="chevron" className="h-4 w-4" />
        </Link>
      ) : open ? (
        <div className="mt-4 space-y-3">
          <label htmlFor="withdraw-amount" className="block text-[13px] font-semibold">Amount</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">₦</span>
            <input id="withdraw-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              className="h-12 w-full rounded-2xl border-[1.5px] border-card bg-bg pl-9 pr-4 text-[15.5px] font-semibold outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10" />
          </div>
          <p className="text-xs text-muted">To <b className="text-ink">{account.accountName}</b> · {account.bankName} {maskAccount(account.accountNumber)}</p>
          {error && <p role="alert" className="rounded-xl bg-[#C2344D]/8 px-3 py-2 text-xs font-medium text-[#C2344D]">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="md" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button size="md" onClick={withdraw} loading={busy} loadingText="Sending…">Withdraw</Button>
          </div>
        </div>
      ) : (
        <Button size="md" className="mt-4" onClick={start} disabled={balance.available < 100}>
          <Icon name="download" className="h-4 w-4" /> Withdraw to {account.bankName}
        </Button>
      )}

      {payouts.length > 0 && (
        <div className="mt-5 border-t border-card pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Payouts & refunds</p>
          <ul className="mt-2 divide-y divide-card">
            {payouts.slice(0, 6).map((p) => (
              <li key={p.reference} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{naira(p.amount)}{p.kind === "refund" && <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">Refund</span>}</p>
                  <p className="truncate text-[11px] text-muted">{timeAgo(p.createdAt)} · {p.kind === "refund" ? `${p.accountName} · ${p.bankName}` : `${p.bankName} ${maskAccount(p.accountNumber)}`}</p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  {p.status === "processing" && (
                    <button onClick={() => check(p.reference)} className="text-[11px] font-bold text-primary hover:underline" disabled={checking === p.reference}>
                      {checking === p.reference ? "Checking…" : "Check"}
                    </button>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusStyle[p.status]}`}>{statusLabel[p.status]}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
