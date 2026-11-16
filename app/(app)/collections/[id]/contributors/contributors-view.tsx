"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, EmptyState } from "@/components/Card";
import Icon, { type IconName } from "@/components/Icon";
import { methodLabel, naira, timeAgo, type Collection, type Contributor, type ContributorSummary, type PaymentLine } from "@/lib/data";
import RefundForm from "@/components/RefundForm";
import { useRouter } from "next/navigation";

type Filter = "all" | "paid" | "part" | "unpaid";
const PAGE = 30;

const BADGE: Record<Contributor["status"], { label: string; cls: string }> = {
  paid: { label: "Fully paid", cls: "bg-[#2E9E6B]/12 text-[#23885A]" },
  part: { label: "Part paid", cls: "bg-[#E8A33D]/15 text-[#A86B12]" },
  unpaid: { label: "Not paid", cls: "bg-[#C2344D]/10 text-[#C2344D]" },
};

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase() ?? "").join("") || "?";
const intlPhone = (p: string) => { const d = p.replace(/\D/g, ""); return d.startsWith("0") ? "234" + d.slice(1) : d; };
const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" });

function Summary({ icon, label, value, sub, tone = "default", className = "" }: { icon: IconName; label: string; value: string | number; sub?: string; tone?: "default" | "good" | "warn" | "bad"; className?: string }) {
  const ring = { default: "bg-white text-primary", good: "bg-[#2E9E6B]/12 text-[#23885A]", warn: "bg-[#E8A33D]/15 text-[#A86B12]", bad: "bg-[#C2344D]/10 text-[#C2344D]" }[tone];
  return (
    <Card tone="tinted" className={`p-4 ${className}`}>
      <span className={`grid h-9 w-9 place-items-center rounded-xl shadow-sm ${ring}`}><Icon name={icon} className="h-[18px] w-[18px]" /></span>
      <p className="mt-3 text-xs font-semibold text-muted">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold tracking-tight md:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] font-medium text-muted">{sub}</p>}
    </Card>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-2xl bg-bg px-3.5 py-3">
      <dt className="text-[11px] font-semibold text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-bold">{value || <span className="font-medium text-muted">Not provided</span>}</dd>
    </div>
  );
}

export default function ContributorsView({ collection: c, contributors, summary, available }: { collection: Collection; contributors: Contributor[]; summary: ContributorSummary; available: number }) {
  const router = useRouter();
  const [refunding, setRefunding] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  /** Suggest refunding only what was overpaid; a flagged repeat payment can be refunded in full. */
  const suggest = (p: Contributor, x: PaymentLine) => {
    const left = x.amount - x.refunded;
    if (x.flagged) return left;
    if (p.expected && p.paid > p.expected) return Math.min(left, p.paid - p.expected);
    return left;
  };
  const fixed = c.contributionType === "fixed";
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [menu]);

  const counts = { all: contributors.length, paid: summary.paid, part: summary.part, unpaid: summary.unpaid };
  const filters: { id: Filter; label: string }[] = fixed
    ? [{ id: "all", label: "All" }, { id: "paid", label: "Fully paid" }, { id: "part", label: "Part paid" }, { id: "unpaid", label: "Not paid" }]
    : [{ id: "all", label: "All" }, { id: "paid", label: "Contributed" }, { id: "unpaid", label: "Not paid" }];

  const list = useMemo(() => {
    const term = query.trim().toLowerCase();
    return contributors.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!term) return true;
      return [p.name, p.memberId, p.phone, ...Object.values(p.details), ...p.payments.map((x) => x.reference)].some((v) => v?.toLowerCase().includes(term));
    });
  }, [contributors, filter, query]);
  useEffect(() => setLimit(PAGE), [filter, query]);

  const hasList = contributors.some((x) => x.onList);
  const fields = (c.contributorFields ?? ["Full Name"]).filter((f) => f !== "Full Name");
  const exportHref = (view: string, format: string) => `/api/collections/${c.id}/report?view=${view}&format=${format}`;
  const remindText = (p: Contributor) =>
    `Hi ${p.name.split(/\s+/)[0]}, a reminder about *${c.name}*.${p.status === "part" ? ` You've paid ${naira(p.paid)}; your balance is ${naira(p.outstanding)}.` : fixed ? ` The amount is ${naira(p.expected ?? 0)}.` : ""}\nPay here: ${c.link ?? ""}\nThank you!`;

  return (
    <div className="space-y-5">
      <Link href={`/collections/${c.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary"><Icon name="back" className="h-4 w-4" /> {c.name}</Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Collection management</p>
          <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight">Contributors</h1>
          <p className="mt-1 text-sm text-muted">Everyone in <b className="text-ink">{c.name}</b>: who has paid, how much, and who still owes.</p>
        </div>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-white shadow-cta transition hover:bg-primary-dark">
            <Icon name="download" className="h-4 w-4" /> Export
          </button>
          {menu && (
            <div role="menu" className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-card bg-white p-1.5 shadow-soft">
              {[
                { href: exportHref("contributors", "xlsx"), icon: "sheet" as const, label: "Contributors (Excel)", sub: "One row per person, with balances" },
                { href: exportHref("contributors", "csv"), icon: "download" as const, label: "Contributors (CSV)", sub: "For Google Sheets or anything else" },
                { href: exportHref("payments", "xlsx"), icon: "sheet" as const, label: "All payments (Excel)", sub: "Every verified payment and reference" },
              ].map((o) => (
                <a key={o.label} role="menuitem" href={o.href} onClick={() => setMenu(false)} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-bg">
                  <Icon name={o.icon} className="mt-0.5 h-4 w-4 flex-none text-primary" />
                  <span><span className="block text-sm font-bold">{o.label}</span><span className="block text-[11px] text-muted">{o.sub}</span></span>
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-2xl bg-[#2E9E6B]/10 p-3.5 text-sm font-medium text-[#23885A]">
          <Icon name="check" className="h-4 w-4 flex-none" width={3} /> {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss" className="ml-auto grid h-6 w-6 place-items-center rounded-full hover:bg-white/60"><Icon name="x" className="h-3.5 w-3.5" /></button>
        </p>
      )}

      <section className={`grid grid-cols-2 gap-3 ${fixed ? "lg:grid-cols-5" : "lg:grid-cols-4"}`} aria-label="Summary">
        <Summary icon="users" label="People" value={summary.people} sub={`${summary.contributors} have paid something`} />
        <Summary icon="check" label={fixed ? "Fully paid" : "Contributed"} value={summary.paid} tone="good" />
        {fixed && <Summary icon="clock" label="Part paid" value={summary.part} tone="warn" />}
        <Summary icon="alert" label="Not paid" value={summary.unpaid} sub={hasList ? "From your class list" : "Add a class list to see who hasn’t paid"} tone="bad" />
        {fixed
          ? <Summary icon="wallet" label="Outstanding" value={naira(summary.outstanding)} sub={`${naira(summary.collected)} collected`} className="col-span-2 lg:col-span-1" />
          : <Summary icon="wallet" label="Collected" value={naira(summary.collected)} />}
      </section>

      <Card className="p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter contributors">
            {filters.map((f) => (
              <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${filter === f.id ? "bg-primary text-white" : "bg-card text-ink hover:bg-accent/30"}`}>
                {f.label} <span className={`rounded-full px-1.5 text-[10px] ${filter === f.id ? "bg-white/25" : "bg-white text-muted"}`}>{counts[f.id]}</span>
              </button>
            ))}
          </div>
          <label className="relative block md:w-72">
            <span className="sr-only">Search contributors</span>
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, matric no, phone…"
              className="h-11 w-full rounded-xl border border-card bg-bg pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
        </div>

        <h2 className="mb-1 mt-5 text-sm font-bold">Contributor directory <span className="font-medium text-muted">· {list.length}</span></h2>
        {contributors.length === 0 ? (
          <EmptyState icon="users" title="No contributors yet" text="When people pay, or when you add a class list on the collection page, they’ll appear here." />
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No one matches that search.</p>
        ) : (
          <ul className="divide-y divide-card">
            {list.slice(0, limit).map((p) => {
              const isOpen = open === p.key;
              const contact = [p.memberId ?? p.details["Matriculation Number"], p.phone ?? p.details["Phone Number"], p.details["Email Address"]].filter(Boolean).join(" · ");
              return (
                <li key={p.key}>
                  <button onClick={() => setOpen(isOpen ? null : p.key)} aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 rounded-2xl px-1 py-3 text-left transition hover:bg-bg/70">
                    <span className={`grid h-10 w-10 flex-none place-items-center rounded-full text-sm font-bold ${p.status === "unpaid" ? "bg-card text-muted" : "bg-accent/40 text-primary"}`}>{initials(p.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate text-sm font-semibold">{p.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${BADGE[p.status].cls}`}>{fixed || p.status === "unpaid" ? BADGE[p.status].label : "Contributed"}</span>
                        {p.refunded > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Refunded {naira(p.refunded)}</span>}
                        {p.payments.some((x) => x.flagged && x.refunded < x.amount) && <span className="rounded-full bg-[#E8A33D]/15 px-2 py-0.5 text-[10px] font-bold text-[#A86B12]">Paid twice</span>}
                        {!p.onList && hasList && <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-muted">Not on list</span>}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">{contact || (p.lastPaid ? `Paid ${timeAgo(p.lastPaid)}` : "No payment yet")}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-bold">{naira(p.paid)}</span>
                      {fixed && p.outstanding > 0 && <span className="block text-[11px] font-semibold text-[#C2344D]">{naira(p.outstanding)} left</span>}
                    </span>
                    <Icon name="chevron" className={`h-4 w-4 flex-none text-muted transition ${isOpen ? "rotate-90" : ""}`} />
                  </button>

                  {isOpen && (
                    <div className="reveal mb-3 space-y-4 rounded-3xl border border-card bg-white p-4 md:p-5">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Personal information</h3>
                        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                          <Info label="Full name" value={p.name} />
                          {fields.map((f) => <Info key={f} label={f} value={(/matric|reg|\bid\b/i.test(f) && p.memberId) || p.details[f] || (/phone/i.test(f) ? p.phone : null)} />)}
                          {!fields.some((f) => /matric|reg|\bid\b/i.test(f)) && p.memberId && <Info label="ID on class list" value={p.memberId} />}
                          {!fields.some((f) => /phone/i.test(f)) && p.phone && <Info label="Phone" value={p.phone} />}
                          {hasList && <Info label="On class list" value={p.onList ? "Yes" : "No"} />}
                        </dl>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Contribution summary</h3>
                        <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <Info label="Paid" value={naira(p.paid)} />
                          {fixed && <Info label="Expected" value={naira(p.expected ?? 0)} />}
                          {fixed && <Info label="Balance" value={naira(p.outstanding)} />}
                          <Info label="Payments" value={String(p.payments.length)} />
                          {p.refunded > 0 && <Info label="Refunded" value={naira(p.refunded)} />}
                        </dl>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Payment history</h3>
                        {p.payments.length ? (
                          <ul className="mt-2 divide-y divide-card rounded-2xl border border-card">
                            {p.payments.map((x) => (
                              <li key={x.reference} className="px-3.5 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[#2E9E6B]/12 text-[#23885A]"><Icon name="check" className="h-4 w-4" width={3} /></span>
                                  <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">{naira(x.amount)} <span className="font-medium text-muted">· {methodLabel(x.method)}</span>
                                      {x.flagged && x.refunded < x.amount && <span className="rounded-full bg-[#E8A33D]/15 px-2 py-0.5 text-[10px] font-bold text-[#A86B12]">Paid twice</span>}
                                    </span>
                                    <span className="block truncate text-[11px] text-muted">{when(x.paidAt)} · <span className="font-mono">{x.reference}</span></span>
                                  </span>
                                  <span className="flex flex-none flex-col items-end gap-1">
                                    <a href={`/receipt/${x.reference}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline">Receipt</a>
                                    {x.refunded < x.amount && refunding !== x.reference && (
                                      <button onClick={() => { setRefunding(x.reference); setNotice(""); }} className="text-xs font-bold text-[#C2344D] hover:underline">Refund</button>
                                    )}
                                  </span>
                                </div>
                                {x.refunds.map((r) => (
                                  <p key={r.reference} className={`ml-11 mt-1.5 text-[11px] font-semibold ${r.status === "failed" ? "text-[#C2344D]" : r.status === "processing" ? "text-[#A86B12]" : "text-primary"}`}>
                                    ↩ {naira(r.amount)} refund {r.status === "successful" ? "sent" : r.status === "processing" ? "processing" : "failed"} to {r.accountName} · {r.bankName} · {timeAgo(r.at)}
                                  </p>
                                ))}
                                {refunding === x.reference && (
                                  <div className="mt-3">
                                    <RefundForm collectionId={c.id} reference={x.reference} payerName={p.name} max={x.amount - x.refunded} suggested={suggest(p, x)} available={available}
                                      onCancel={() => setRefunding(null)}
                                      onDone={(m) => { setRefunding(null); setNotice(m); router.refresh(); }} />
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : <p className="mt-2 rounded-2xl bg-bg px-3.5 py-3 text-sm text-muted">No payment yet.</p>}
                      </div>

                      {p.status !== "paid" && p.phone && c.status === "Active" && (
                        <a href={`https://wa.me/${intlPhone(p.phone)}?text=${encodeURIComponent(remindText(p))}`} target="_blank" rel="noreferrer"
                          className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#25D366]/12 text-sm font-bold text-[#128C4A] transition hover:bg-[#25D366]/20">
                          <Icon name="share" className="h-4 w-4" /> Remind {p.name.split(/\s+/)[0]} on WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {list.length > limit && (
          <button onClick={() => setLimit((n) => n + PAGE)} className="mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-primary hover:bg-bg">
            Show more ({list.length - limit} left)
          </button>
        )}
      </Card>
    </div>
  );
}
