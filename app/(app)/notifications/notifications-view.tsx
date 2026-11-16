"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, EmptyState } from "@/components/Card";
import Icon, { type IconName } from "@/components/Icon";
import { timeAgo, type Notice } from "@/lib/data";
import { readSeen, writeSeen } from "@/lib/notices-seen";
import { useApp } from "@/lib/create-collection";

type Tab = "all" | "payments" | "payouts";

const STYLE: Record<Notice["kind"], { icon: IconName; cls: string }> = {
  payment: { icon: "wallet", cls: "bg-[#2E9E6B]/12 text-[#23885A]" },
  flag: { icon: "alert", cls: "bg-[#E8A33D]/15 text-[#A86B12]" },
  payout_ok: { icon: "payout", cls: "bg-primary/10 text-primary" },
  payout_processing: { icon: "clock", cls: "bg-card text-primary" },
  payout_failed: { icon: "alert", cls: "bg-[#C2344D]/10 text-[#C2344D]" },
};

function dayLabel(iso: string) {
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
  const d = day(new Date(iso));
  if (d === day(new Date())) return "Today";
  if (d === day(new Date(Date.now() - 864e5))) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" });
}

export default function NotificationsView({ notices }: { notices: Notice[] }) {
  const { refresh } = useApp();
  const [tab, setTab] = useState<Tab>("all");
  // What was unread when the page opened stays highlighted; opening the page marks everything read.
  const [seenAtOpen, setSeenAtOpen] = useState<string | null>(null);
  useEffect(() => { setSeenAtOpen(readSeen()); writeSeen(notices[0]?.at); }, [notices]);
  // New payments arrive while the page is open.
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 20000);
    return () => clearInterval(id);
  }, [refresh]);

  const shown = notices.filter((n) => tab === "all" || (tab === "payments" ? n.kind === "payment" || n.kind === "flag" : n.kind.startsWith("payout")));
  const groups = useMemo(() => {
    const m = new Map<string, Notice[]>();
    for (const n of shown) { const k = dayLabel(n.at); m.set(k, [...(m.get(k) ?? []), n]); }
    return Array.from(m.entries());
  }, [shown]);
  const unread = seenAtOpen === null ? 0 : notices.filter((n) => n.at > seenAtOpen).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted">{unread ? `${unread} new since your last visit` : "Payments verified by Paga and your withdrawals, as they happen."}</p>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Filter notifications">
          {([["all", "All"], ["payments", "Payments"], ["payouts", "Withdrawals"]] as const).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${tab === id ? "bg-primary text-white" : "bg-card text-ink hover:bg-accent/30"}`}>{label}</button>
          ))}
        </div>
      </header>

      {shown.length === 0 ? (
        <EmptyState icon="bell" title="Nothing here yet" text={tab === "payouts" ? "Withdrawals you make will show up here." : "Share a collection link. Every verified payment shows up here straight away."} />
      ) : (
        groups.map(([day, items]) => (
          <section key={day} aria-label={day}>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted">{day}</h2>
            <Card className="divide-y divide-card p-1.5">
              {items.map((n) => {
                const isNew = seenAtOpen !== null && n.at > seenAtOpen;
                return (
                  <Link key={n.id} href={n.href} className={`flex items-start gap-3 rounded-2xl px-3 py-3 transition hover:bg-bg ${isNew ? "bg-primary/[0.04]" : ""}`}>
                    <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${STYLE[n.kind].cls}`}><Icon name={STYLE[n.kind].icon} className="h-[18px] w-[18px]" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-bold">{n.title}{isNew && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">New</span>}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-ink/85">{n.text}</span>
                      <span className="mt-1 block text-[11px] text-muted">{timeAgo(n.at)}</span>
                    </span>
                    <Icon name="chevron" className="mt-3 h-4 w-4 flex-none text-muted" />
                  </Link>
                );
              })}
            </Card>
          </section>
        ))
      )}
    </div>
  );
}
