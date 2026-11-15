"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card, EmptyState } from "@/components/Card";
import Field from "@/components/Field";
import Icon from "@/components/Icon";
import WalletIllustration from "@/components/WalletIllustration";
import { LinkButton } from "@/components/Button";
import { useApp } from "@/lib/create-collection";
import { naira, percent, timeAgo, type Contribution } from "@/lib/data";
import { reopenCollectionAction } from "@/app/actions/collections";

const methodLabel = (m: string) => (m.includes("USSD") ? "USSD" : m.includes("CARD") ? "Card" : m.includes("WALLET") || m.includes("REQUEST_MONEY") ? "Paga wallet" : "Bank transfer");

export default function CollectionView({ id, contributions, qr }: { id: string; contributions: Contribution[]; qr: string | null }) {
  const { collections, closeCollection, updateCollection, refresh } = useApp();
  const c = collections.find((x) => x.id === id);
  const [showAll, setShowAll] = useState(false);
  const [reopening, setReopening] = useState(false);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [errs, setErrs] = useState<{ name?: string; desc?: string }>({});
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (window.location.hash === "#edit") startEdit(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [c?.id]);

  if (!c) {
    return (
      <EmptyState icon="inbox" title="Collection not found" text="It may have been removed, or the link is incorrect."
        action={<LinkButton href="/collections" size="md">Back to Collections</LinkButton>} />
    );
  }

  const done = c.status === "Completed";
  const pct = percent(c);
  const url = c.link ?? `https://${c.url}`;
  const contributors = c.contributors ?? contributions.length;
  const shown = showAll ? contributions : contributions.slice(0, 8);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${c.name}\n${c.contribution ?? ""}\nPay here: ${url}`)}`;

  function startEdit() { if (c) { setName(c.name); setDesc(c.description ?? ""); setErrs({}); setEditing(true); } }
  const save = async () => {
    const e: typeof errs = {};
    if (name.trim().length < 3) e.name = "Name should be at least 3 characters.";
    if (desc.trim().length < 10) e.desc = "Description should be at least 10 characters.";
    setErrs(e);
    if (e.name || e.desc) return;
    setSaving(true);
    const error = await updateCollection(c.id, { name: name.trim(), description: desc.trim() });
    setSaving(false);
    if (error) { setErrs({ name: error }); return; }
    setEditing(false);
  };
  const close = async () => {
    if (!window.confirm("Close this collection? People won’t be able to pay into it any more. You can reopen it later.")) return;
    setClosing(true); await closeCollection(c.id); setClosing(false);
  };
  const reopen = async () => { setReopening(true); await reopenCollectionAction(c.id); refresh(); setReopening(false); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { /* unavailable */ }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5">
      <Link href="/collections" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary"><Icon name="back" className="h-4 w-4" /> Collections</Link>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="relative grid h-44 place-items-center overflow-hidden bg-gradient-to-br from-[#E8DDF0] via-[#DCCDEB] to-accent">
              <WalletIllustration className="h-44 w-auto max-w-none" />
              <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold shadow-sm ${done ? "text-[#23885A]" : "text-primary"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-[#2E9E6B]" : "bg-primary"}`} /> {c.status}
              </span>
            </div>
            <div className="space-y-4 p-5 md:p-7">
              {editing ? (
                <div className="space-y-4">
                  <Field id="ename" label="Collection Name" value={name} onChange={setName} error={errs.name} />
                  <Field id="edesc" label="Description" multiline maxLength={300} value={desc} onChange={setDesc} error={errs.desc} />
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" size="md" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                    <Button size="md" onClick={save} loading={saving} loadingText="Saving…">Save changes</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="text-2xl font-extrabold leading-tight tracking-tight">{c.name}</h1>
                      {c.organisation && <p className="mt-1 text-sm text-muted">Organised by <b className="text-ink">{c.organisation}</b></p>}
                    </div>
                    <button onClick={startEdit} className="flex-none rounded-xl bg-card px-3.5 py-2 text-xs font-bold text-primary transition hover:bg-accent/30">Edit</button>
                  </div>
                  <p className="text-[15px] leading-relaxed text-ink/90">{c.description ?? "No description added."}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-card p-3.5"><p className="text-xs font-semibold text-muted">Contribution</p><p className="mt-1 font-bold">{c.contribution ?? "Flexible · give what you can"}</p></div>
                    <div className="rounded-2xl border border-card p-3.5"><p className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Icon name="calendar" className="h-3.5 w-3.5 text-primary" /> Deadline</p><p className="mt-1 font-bold">{c.due}</p></div>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="p-5 md:p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold">Recent contributions</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted">{contributors} payment{contributors === 1 ? "" : "s"}</span>
                {contributions.length > 0 && (
                  <a href={`/api/collections/${c.id}/report`} className="inline-flex items-center gap-1.5 rounded-xl bg-card px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-accent/30">
                    <Icon name="chart" className="h-3.5 w-3.5" /> Export CSV
                  </a>
                )}
              </div>
            </div>
            {contributions.length > 0 ? (
              <>
                <ul className="divide-y divide-card">
                  {shown.map((p) => (
                    <li key={p.reference} className="flex items-center gap-3 py-3">
                      <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-accent/40 text-sm font-bold text-primary">{p.name[0]?.toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate text-sm font-semibold">
                          {p.name}
                          {p.flagged && <span className="rounded-full bg-[#E8A33D]/15 px-2 py-0.5 text-[10px] font-bold text-[#A86B12]">Paid twice</span>}
                        </p>
                        <p className="text-xs text-muted">{timeAgo(p.paidAt)} · {methodLabel(p.method)} · <span className="inline-flex items-center gap-0.5 font-semibold text-[#23885A]"><Icon name="check" className="h-3 w-3" width={3} /> Verified by Paga</span></p>
                      </div>
                      <a href={`/receipt/${p.reference}`} target="_blank" rel="noreferrer" className="text-right">
                        <p className="text-sm font-bold">{naira(p.amount)}</p>
                        <p className="text-[11px] font-semibold text-primary hover:underline">Receipt</p>
                      </a>
                    </li>
                  ))}
                </ul>
                {contributions.length > 8 && (
                  <button onClick={() => setShowAll((v) => !v)} className="mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-primary hover:bg-bg">
                    {showAll ? "Show fewer" : `Show all ${contributions.length}`}
                  </button>
                )}
              </>
            ) : (
              <EmptyState icon="users" title="No contributions yet" text="Share your link to start receiving contributions." />
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card tone="tinted" className="p-5">
            <p className="text-xs font-semibold text-muted">Collected</p>
            <p className="mt-1 text-[28px] font-extrabold tracking-tight">{naira(c.collected)}</p>
            {c.target > 0 ? (
              <>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-accent/40" role="progressbar" aria-valuenow={Math.min(pct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#9468EE] to-primary transition-[width] duration-700" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="mt-2 flex justify-between text-xs font-medium text-muted"><span>of {naira(c.target)} target</span><b className="text-primary">{pct}%</b></p>
              </>
            ) : <p className="mt-2 text-xs font-medium text-muted">No target set</p>}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-bold">Public link</h2>
            <p className="mt-2 flex items-center gap-2 break-all rounded-xl bg-bg px-3 py-2.5 text-xs font-medium text-muted"><Icon name="link" className="h-4 w-4 flex-none text-primary" />{url.replace(/^https?:\/\//, "")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" size="md" onClick={copy}><Icon name="copy" className="h-4 w-4" /> {copied ? "Copied" : "Copy link"}</Button>
              <a href={whatsapp} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25D366]/12 px-4 text-sm font-bold text-[#128C4A] transition hover:bg-[#25D366]/20">
                <Icon name="share" className="h-4 w-4" /> WhatsApp
              </a>
            </div>
            {qr && !done && (
              <div className="mt-4 flex items-center gap-4 rounded-2xl bg-bg p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt={`QR code for ${c.name}`} className="h-24 w-24 rounded-xl bg-white p-1.5" />
                <div className="text-xs text-muted">
                  <p className="font-bold text-ink">Scan to pay</p>
                  <p className="mt-1">Print it or show it at your meeting. It opens this collection’s payment page.</p>
                  <a href={qr} download={`${c.slug ?? "kolekt"}-qr.png`} className="mt-2 inline-block font-bold text-primary hover:underline">Download QR</a>
                </div>
              </div>
            )}
          </Card>

          {!done ? (
            <Button variant="secondary" onClick={close} loading={closing} loadingText="Closing…" className="!text-[#C2344D]">Close collection</Button>
          ) : c.publicationStatus === "CLOSED" ? (
            <Button variant="secondary" onClick={reopen} loading={reopening} loadingText="Reopening…">Reopen collection</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
