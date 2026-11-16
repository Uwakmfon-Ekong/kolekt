"use client";

import { useEffect, useState } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import Field from "./Field";
import Icon from "./Icon";
import { maskAccount, type PayoutAccount } from "@/lib/data";
import { listBanksAction, savePayoutAccountAction, verifyAccountAction } from "@/app/actions/payouts";
import { useApp } from "@/lib/create-collection";

type Bank = { name: string; uuid: string };

/** Where collected money is paid out. The account name comes from Paga, never from what's typed. */
export default function PayoutAccountCard({ account }: { account: PayoutAccount | null | undefined }) {
  const { refresh } = useApp();
  const [editing, setEditing] = useState(false);
  const [banks, setBanks] = useState<Bank[] | null>(null);
  const [bank, setBank] = useState("");
  const [number, setNumber] = useState("");
  const [verified, setVerified] = useState<{ accountName: string; bankName: string } | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"" | "verify" | "save">("");

  useEffect(() => {
    if (!editing || banks) return;
    listBanksAction().then((r) => (r.ok ? setBanks(r.data) : setError(r.error)));
  }, [editing, banks]);

  // Any change to the bank or number invalidates the lookup.
  useEffect(() => { setVerified(null); }, [bank, number]);

  const verify = async () => {
    setError("");
    if (!bank) return setError("Choose your bank.");
    if (!/^\d{10}$/.test(number)) return setError("Account numbers have 10 digits.");
    setBusy("verify");
    const r = await verifyAccountAction(bank, number);
    setBusy("");
    if (!r.ok) return setError(r.error);
    setVerified(r.data);
  };

  const save = async () => {
    setError("");
    if (!password) return setError("Enter your password to confirm.");
    setBusy("save");
    const r = await savePayoutAccountAction({ bankUUID: bank, accountNumber: number, password });
    setBusy("");
    if (!r.ok) return setError(r.error);
    setEditing(false); setPassword(""); setNumber(""); setBank(""); setVerified(null);
    refresh();
  };

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-card text-primary"><Icon name="wallet" className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold">Payout account</h2>
          <p className="mt-0.5 text-sm text-muted">Where Kolekt pays out what you collect, through Paga.</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="flex-none rounded-xl bg-card px-3.5 py-2 text-xs font-bold text-primary transition hover:bg-accent/30">
            {account ? "Change" : "Add"}
          </button>
        )}
      </div>

      {!editing && (account ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-bg p-3.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{account.accountName}</p>
            <p className="text-xs text-muted">{account.bankName} · {maskAccount(account.accountNumber)}</p>
          </div>
          <span className="inline-flex flex-none items-center gap-1 rounded-full bg-[#2E9E6B]/12 px-2.5 py-1 text-[11px] font-bold text-[#23885A]">
            <Icon name="check" className="h-3 w-3" width={3} /> Verified
          </span>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-accent bg-card/50 p-3.5 text-sm text-muted">No payout account yet. Add one to withdraw your collections.</p>
      ))}

      {editing && (
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold">Bank</span>
            <select value={bank} onChange={(e) => setBank(e.target.value)} disabled={!banks}
              className="h-[52px] w-full rounded-2xl border-[1.5px] border-card bg-white px-4 text-[15px] font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10">
              <option value="">{banks ? "Choose your bank" : "Loading banks…"}</option>
              {banks?.map((b) => <option key={b.uuid} value={b.uuid}>{b.name}</option>)}
            </select>
          </label>
          <Field id="payout-number" label="Account number" inputMode="numeric" autoComplete="off" placeholder="10-digit account number"
            value={number} onChange={(v) => setNumber(v.replace(/\D/g, "").slice(0, 10))} />

          {verified ? (
            <>
              <div className="flex items-center gap-3 rounded-2xl bg-[#2E9E6B]/8 p-3.5">
                <Icon name="check" className="h-5 w-5 flex-none text-[#23885A]" width={2.6} />
                <div className="min-w-0 text-sm">
                  <p className="font-bold">{verified.accountName}</p>
                  <p className="text-xs text-muted">{verified.bankName} · confirmed by Paga</p>
                </div>
              </div>
              <Field id="payout-password" label="Your Kolekt password" type="password" autoComplete="current-password"
                placeholder="To confirm it’s you" value={password} onChange={setPassword} />
            </>
          ) : null}

          {error && <p role="alert" className="rounded-xl bg-[#C2344D]/8 px-3.5 py-2.5 text-[13px] font-medium text-[#C2344D]">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="md" onClick={() => { setEditing(false); setError(""); }} disabled={!!busy}>Cancel</Button>
            {verified ? (
              <Button size="md" onClick={save} loading={busy === "save"} loadingText="Saving…">Save account</Button>
            ) : (
              <Button size="md" onClick={verify} loading={busy === "verify"} loadingText="Checking…">Verify account</Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
