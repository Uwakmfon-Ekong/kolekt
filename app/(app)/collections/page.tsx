"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CollectionCard from "@/components/CollectionCard";
import Icon from "@/components/Icon";
import { naira } from "@/lib/data";
import { useApp } from "@/lib/create-collection";

const tabs = ["All", "Active", "Completed"] as const;
type Tab = (typeof tabs)[number];

export default function CollectionsPage() {
  const { collections: items, closeCollection } = useApp();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("All");

  const filtered = useMemo(
    () => items.filter((c) => (tab === "All" || c.status === tab) && c.name.toLowerCase().includes(q.trim().toLowerCase())),
    [items, q, tab]
  );
  const total = filtered.reduce((s, c) => s + c.collected, 0);
  const count = (t: Tab) => (t === "All" ? items.length : items.filter((c) => c.status === t).length);
  const close = closeCollection;

  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-3 text-sm text-muted">
        <Link href="/dashboard" aria-label="Back to dashboard" className="grid h-11 w-11 place-items-center rounded-2xl border border-accent/40 bg-white text-ink shadow-sm transition hover:text-primary">
          <Icon name="back" />
        </Link>
        <span>Dashboard / <span className="font-semibold text-ink">Collections</span></span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[240px] flex-1">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight md:text-3xl">Collections</h1>
          <p className="mt-1.5 text-[15px] text-muted">Manage and monitor all your collections.</p>
        </div>
        <Link href="/collections/create/details" className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#8553E6] to-primary px-6 text-[15px] font-bold text-white shadow-cta transition hover:to-primary-dark active:scale-[.985] md:w-auto">
          <Icon name="plus" className="h-5 w-5" width={2.6} /> Create Collection
        </Link>
      </div>

      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search collections..." aria-label="Search collections" autoComplete="off"
          className="h-[54px] w-full rounded-[18px] border-[1.5px] border-card bg-white pl-12 pr-12 text-[15.5px] font-medium shadow-sm outline-none transition placeholder:text-[#B1A8B8] focus:border-primary focus:ring-4 focus:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-muted hover:bg-card hover:text-ink">
            <Icon name="x" className="h-4 w-4" width={2.5} />
          </button>
        )}
      </div>

      <div role="tablist" aria-label="Filter collections" className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`flex h-10 flex-none items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${tab === t ? "bg-primary text-white shadow-cta" : "bg-card text-muted hover:text-ink"}`}>
            {t}
            <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold ${tab === t ? "bg-white/20" : "bg-white text-primary"}`}>{count(t)}</span>
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#9468EE] p-5 text-white shadow-cta">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-white/75">{tab === "All" ? "All collections" : `${tab} collections`}</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight">{naira(total)}</p>
            <p className="text-xs text-white/75">collected</p>
          </div>
          <p className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{filtered.length} {filtered.length === 1 ? "collection" : "collections"}</p>
        </div>
      </div>

      {filtered.length ? (
        <div className="grid gap-3.5 md:grid-cols-2 md:gap-5 xl:grid-cols-3" aria-live="polite">
          {filtered.map((c) => (
            <CollectionCard key={c.id} c={c} meta={c.status === "Completed" ? "Closed" : c.due} onClose={() => close(c.id)} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-accent bg-card/60 px-6 py-12 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-primary shadow-sm"><Icon name="layers" className="h-7 w-7" /></span>
          <p className="mt-4 text-base font-bold">{q ? "No collections found" : `No ${tab.toLowerCase()} collections yet`}</p>
          <p className="mt-1 text-sm text-muted">{q ? "Try a different name." : "Closed collections will appear here."}</p>
        </div>
      )}
    </div>
  );
}
