"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { Collection, naira, percent } from "@/lib/data";

export default function CollectionCard({ c, meta, onClose }: { c: Collection; meta?: string; onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pct = percent(c);
  const done = c.status === "Completed";
  const note = meta ?? c.note;

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(`https://${c.url ?? `kolekt.app/c/${c.id}`}`); } catch { /* clipboard unavailable */ }
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 900);
  };

  return (
    <div className="relative rounded-3xl border border-white/70 bg-card shadow-soft transition hover:-translate-y-0.5">
      <Link href={`/collections/${c.id}`} className="block rounded-3xl p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <div className="flex items-center gap-3 pr-10">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-white text-primary shadow-sm">
            <Icon name={c.icon} className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold">{c.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${done ? "bg-[#2E9E6B]/10 text-[#23885A]" : "bg-primary/10 text-primary"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-[#2E9E6B]" : "bg-primary"}`} /> {c.status}
              </span>
              {note && <span className="font-medium text-muted">{note}</span>}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-xl font-extrabold tracking-tight">{naira(c.collected)}</p>
            <p className="text-xs font-medium text-muted">{c.target ? `of ${naira(c.target)} target` : "No target set"}</p>
          </div>
          {c.target > 0 && <p className="text-sm font-bold text-primary">{pct}% collected</p>}
        </div>

        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-accent/40" role="progressbar" aria-valuenow={Math.min(pct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.name} progress`}>
          <div className="h-full rounded-full bg-gradient-to-r from-[#9468EE] to-primary transition-[width] duration-700" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </Link>

      <div ref={ref} className="absolute right-3 top-3">
        <button onClick={() => setOpen((v) => !v)} aria-label={`Actions for ${c.name}`} aria-haspopup="menu" aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-xl text-muted transition hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          <Icon name="more" className="h-5 w-5" />
        </button>
        {open && (
          <div role="menu" className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-2xl border border-accent/30 bg-white py-1.5 text-sm font-medium shadow-soft">
            <Link role="menuitem" href={`/collections/${c.id}`} className="block px-4 py-2.5 hover:bg-bg">View details</Link>
            <Link role="menuitem" href={`/collections/${c.id}#edit`} className="block px-4 py-2.5 hover:bg-bg">Edit</Link>
            <button role="menuitem" onClick={copy} className="block w-full px-4 py-2.5 text-left hover:bg-bg">{copied ? "Link copied" : "Share link"}</button>
            {!done && (
              <button role="menuitem" onClick={() => { setOpen(false); onClose?.(); }} className="block w-full px-4 py-2.5 text-left text-[#C2344D] hover:bg-bg">Close collection</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
