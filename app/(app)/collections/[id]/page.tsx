"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card, EmptyState } from "@/components/Card";
import Field from "@/components/Field";
import Icon from "@/components/Icon";
import WalletIllustration from "@/components/WalletIllustration";
import { LinkButton } from "@/components/Button";
import { useApp } from "@/lib/create-collection";
import { naira, percent } from "@/lib/data";

const people = ["Chidinma Okoro", "Emeka Udoh", "Blessing Etim", "Ifeanyi Nwosu", "Mfon Akpan"];
const when = ["2 hours ago", "Yesterday", "2 days ago", "3 days ago", "Last week"];
const amounts = [5000, 10000, 5000, 2000, 20000];

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>();
  const { collections, closeCollection, updateCollection } = useApp();
  const c = collections.find((x) => x.id === decodeURIComponent(params.id));

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
  const url = `https://${c.url ?? `kolekt.app/c/${c.id}`}`;
  const contributors = c.collected > 0 ? Math.max(1, Math.round(c.collected / 6000)) : 0;

  function startEdit() { if (c) { setName(c.name); setDesc(c.description ?? ""); setErrs({}); setEditing(true); } }
  const save = () => {
    const e: typeof errs = {};
    if (name.trim().length < 3) e.name = "Name should be at least 3 characters.";
    if (desc.trim().length < 10) e.desc = "Description should be at least 10 characters.";
    setErrs(e);
    if (e.name || e.desc) return;
    setSaving(true);
    setTimeout(() => { updateCollection(c.id, { name: name.trim(), description: desc.trim() }); setSaving(false); setEditing(false); }, 700);
  };
  const close = () => { setClosing(true); setTimeout(() => { closeCollection(c.id); setClosing(false); }, 900); };
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
            <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-bold">Recent contributions</h2><span className="text-xs font-semibold text-muted">{contributors} contributor{contributors === 1 ? "" : "s"}</span></div>
            {c.collected > 0 ? (
              <ul className="divide-y divide-card">
                {people.map((p, i) => (
                  <li key={p} className="flex items-center gap-3 py-3">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-accent/40 text-sm font-bold text-primary">{p[0]}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p}</p><p className="text-xs text-muted">{when[i]}</p></div>
                    <p className="text-sm font-bold">{naira(amounts[i])}</p>
                  </li>
                ))}
              </ul>
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
            <p className="mt-2 flex items-center gap-2 break-all rounded-xl bg-bg px-3 py-2.5 text-xs font-medium text-muted"><Icon name="link" className="h-4 w-4 flex-none text-primary" />{url.replace("https://", "")}</p>
            <Button variant="secondary" size="md" className="mt-3" onClick={copy}><Icon name="copy" className="h-4 w-4" /> {copied ? "Link copied" : "Copy link"}</Button>
          </Card>

          {!done && (
            <Button variant="secondary" onClick={close} loading={closing} loadingText="Closing…" className="!text-[#C2344D]">Close collection</Button>
          )}
        </div>
      </div>
    </div>
  );
}
