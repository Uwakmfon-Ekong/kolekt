"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { naira } from "@/lib/data";
import { listBanksAction, refundAction, verifyRecipientAction } from "@/app/actions/payouts";

type Bank = { name: string; uuid: string };
let bankCache: Bank[] | null = null;

const input = "h-11 w-full rounded-xl border border-card bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

/**
 * Refund (part of) one payment to the contributor's bank account through Paga.
 * Paga confirms the account holder's name before anything is sent, and the organiser's password is required.
 */
export default function RefundForm({ collectionId, reference, payerName, max, suggested, available, onDone, onCancel }: {
  collectionId: string; reference: string; payerName: string; max: number; suggested: number; available: number;
  onDone: (message: string) => void; onCancel: () => void;
}) {
  const limit = Math.min(max, available);
  const [banks, setBanks] = useState<Bank[] | null>(bankCache);
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState(String(Math.min(suggested || max, limit)));
  const [verified, setVerified] = useState<{ accountName: string; bankName: string } | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"" | "verify" | "send">("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (bankCache) return;
    listBanksAction().then((r) => { if (r.ok) { bankCache = r.data; setBanks(r.data); } else setError(r.error); });
  }, []);

  const verify = async () => {
    setError(""); setVerified(null);
    if (!bank) return setError("Choose their bank.");
    if (!/^\d{10}$/.test(account)) return setError("Account numbers have 10 digits.");
    setBusy("verify");
    const r = await verifyRecipientAction(bank, account, payerName);
    setBusy("");
    if (!r.ok) return setError(r.error);
    setVerified(r.data);
  };

  const send = async () => {
    setError("");
    const n = Number(amount);
    if (!n || n < 100) return setError("The smallest refund is ₦100.");
    if (n > limit) return setError(`You can refund up to ${naira(limit)}.`);
    if (!password) return setError("Enter your Kolekt password to confirm.");
    setBusy("send");
    const r = await refundAction({ collectionId, transactionReference: reference, amount: n, bankUUID: bank, accountNumber: account, password });
    setBusy("");
    if (!r.ok) return setError(r.error);
    onDone(r.data.status === "successful"
      ? `${naira(r.data.amount)} refunded to ${r.data.accountName} through Paga.`
      : `${naira(r.data.amount)} refund is on its way to ${r.data.accountName}. We’ll confirm with Paga.`);
  };

  if (limit < 100) {
    return (
      <div className="rounded-2xl bg-bg p-3.5 text-xs text-muted">
        {available < 100 ? "There isn’t enough left in this collection to refund (it has been withdrawn)." : "This payment has already been refunded."}
        <button onClick={onCancel} className="ml-2 font-bold text-primary">OK</button>
      </div>
    );
  }

  return (
    <div className="reveal space-y-3 rounded-2xl border border-accent/50 bg-bg/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">Refund through Paga</p>
        <button onClick={onCancel} aria-label="Cancel refund" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-white"><Icon name="x" className="h-4 w-4" /></button>
      </div>
      <p className="text-xs text-muted">Sends money back to {payerName.split(/\s+/)[0]}’s bank account. Up to {naira(limit)} for this payment.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block"><span className="mb-1 block text-[11px] font-bold">Their bank</span>
          <select value={bank} onChange={(e) => { setBank(e.target.value); setVerified(null); }} className={input} disabled={!banks}>
            <option value="">{banks ? "Choose bank" : "Loading banks…"}</option>
            {banks?.map((b) => <option key={b.uuid} value={b.uuid}>{b.name}</option>)}
          </select>
        </label>
        <label className="block"><span className="mb-1 block text-[11px] font-bold">Account number</span>
          <input value={account} onChange={(e) => { setAccount(e.target.value.replace(/\D/g, "").slice(0, 10)); setVerified(null); }} inputMode="numeric" placeholder="10 digits" className={input} />
        </label>
      </div>
      {!verified ? (
        <button onClick={verify} disabled={busy !== ""} className="h-11 w-full rounded-xl bg-white text-sm font-bold text-primary ring-1 ring-accent transition hover:bg-card disabled:opacity-70">
          {busy === "verify" ? "Checking with Paga…" : "Check account name"}
        </button>
      ) : (
        <>
          <p className="flex items-center gap-2 rounded-xl bg-[#2E9E6B]/10 px-3 py-2.5 text-xs text-[#23885A]">
            <Icon name="check" className="h-4 w-4 flex-none" width={3} /> <span><b>{verified.accountName}</b> · {verified.bankName}. Make sure this is the right person.</span>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-[11px] font-bold">Amount (₦)</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={input} />
            </label>
            <label className="block"><span className="mb-1 block text-[11px] font-bold">Your password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={input} />
            </label>
          </div>
          <button onClick={send} disabled={busy !== ""} className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-white shadow-cta transition hover:bg-primary-dark disabled:opacity-70">
            {busy === "send" ? "Sending refund…" : `Refund ${naira(Number(amount) || 0)}`}
          </button>
        </>
      )}
      {error && <p role="alert" className="rounded-xl bg-[#C2344D]/10 p-2.5 text-xs font-medium text-[#C2344D]">{error}</p>}
    </div>
  );
}
