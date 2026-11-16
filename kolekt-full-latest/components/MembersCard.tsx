"use client";

import { useMemo, useRef, useState } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import Icon from "./Icon";
import { naira, timeAgo, type Collection, type MemberStatus } from "@/lib/data";
import { clearRosterAction, removeMemberAction, saveRosterAction } from "@/app/actions/members";
import { useApp } from "@/lib/create-collection";

type Tab = "unpaid" | "paid" | "stranger";
const PAGE = 20;

const intlPhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.startsWith("0") ? "234" + d.slice(1) : d;
};
const firstName = (n: string) => n.trim().split(/\s+/)[0] ?? n;
const fmtDate = (d?: string) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" }) : "";

/** The class / member list: who has paid, who hasn't, and one-tap reminders. */
export default function MembersCard({ collection, status }: { collection: Collection; status: MemberStatus }) {
  const { refresh } = useApp();
  const { members, notOnList } = status;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("unpaid");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [remind, setRemind] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const paid = members.filter((m) => m.status === "paid");
  const owing = members.filter((m) => m.status !== "paid");
  const pct = members.length ? Math.round((paid.length / members.length) * 100) : 0;
  const link = collection.link ?? `https://${collection.url}`;
  const amount = collection.contributionType === "fixed" && collection.contributionAmount ? ` (${naira(collection.contributionAmount)})` : "";

  const list = useMemo(() => {
    const ql = query.trim().toLowerCase();
    const base = tab === "paid" ? paid : tab === "unpaid" ? owing : [];
    return ql ? base.filter((m) => m.name.toLowerCase().includes(ql) || (m.memberId ?? "").toLowerCase().includes(ql)) : base;
  }, [tab, query, paid, owing]);

  const groupMessage = useMemo(() => {
    const names = owing.slice(0, 40).map((m, i) => `${i + 1}. ${m.name}${m.memberId ? ` (${m.memberId})` : ""}`);
    const more = owing.length > 40 ? `\n…and ${owing.length - 40} more` : "";
    return [
      `📢 *${collection.name}*${amount}`,
      `${paid.length} of ${members.length} have paid. Still owing (${owing.length}):`,
      names.join("\n") + more,
      "",
      `Pay here 👉 ${link}`,
      collection.deadline ? `Deadline: ${fmtDate(collection.deadline)}` : "",
      "It takes a minute. No app or account needed 🙏",
    ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n").trim();
  }, [owing, paid.length, members.length, collection.name, collection.deadline, amount, link]);

  const personalMessage = (name: string) =>
    `Hi ${firstName(name)}, quick reminder about *${collection.name}*${amount}. You can pay here: ${link}${collection.deadline ? ` before ${fmtDate(collection.deadline)}` : ""} 🙏`;

  const onFile = (f?: File) => {
    if (!f) return;
    if (f.size > 1024 * 1024) return setError("That file is too big. Use a CSV under 1 MB.");
    f.text().then((t) => { setText(t); setError(""); }).catch(() => setError("We couldn’t read that file."));
  };

  const save = async () => {
    setError(""); setNotice("");
    if (!text.trim()) return setError("Paste your list first, one person per line.");
    setBusy(true);
    const r = await saveRosterAction(collection.id, text, replace);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    const { added, duplicates, skipped } = r.data;
    setNotice(`Added ${added} ${added === 1 ? "person" : "people"}${duplicates ? ` · ${duplicates} already on the list` : ""}${skipped ? ` · ${skipped} line${skipped === 1 ? "" : "s"} skipped` : ""}.`);
    setText(""); setEditing(false); setTab("unpaid"); refresh();
  };

  const clear = async () => {
    if (!window.confirm("Remove everyone from this list? Payments aren’t affected.")) return;
    await clearRosterAction(collection.id); setNotice(""); refresh();
  };
  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the list?`)) return;
    await removeMemberAction(collection.id, id); refresh();
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(groupMessage); } catch { /* clipboard unavailable */ }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const editor = (
    <div className="mt-4 space-y-3">
      <label htmlFor="roster" className="block text-[13px] font-semibold">One person per line: name, then ID or phone if you have them</label>
      <textarea
        id="roster" rows={7} value={text} onChange={(e) => setText(e.target.value)}
        placeholder={"Blessing Etim, CSC/2021/014, 08031234567\nEmeka Udoh, CSC/2021/022\nMfon Akpan"}
        className="w-full rounded-2xl border-[1.5px] border-card bg-bg p-3.5 font-mono text-[13px] leading-relaxed outline-none placeholder:text-[#B1A8B8] focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
      />
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl bg-card px-3 py-2 font-bold text-primary hover:bg-accent/30">
          <Icon name="upload" className="h-3.5 w-3.5" /> Upload CSV
        </button>
        <span className="text-muted">or copy a column from Excel / Google Sheets and paste it</span>
      </div>
      {members.length > 0 && (
        <label className="flex items-center gap-2 text-xs font-medium">
          <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="h-4 w-4 accent-primary" />
          Replace the current list ({members.length} people) instead of adding to it
        </label>
      )}
      {error && <p role="alert" className="rounded-xl bg-[#C2344D]/8 px-3 py-2 text-xs font-medium text-[#C2344D]">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" size="md" onClick={() => { setEditing(false); setError(""); }} disabled={busy}>Cancel</Button>
        <Button size="md" onClick={save} loading={busy} loadingText="Saving…">Save list</Button>
      </div>
    </div>
  );

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">Class list</h2>
          <p className="mt-0.5 text-xs text-muted">See who has paid and who still owes.</p>
        </div>
        {members.length > 0 && !editing && (
          <button onClick={() => { setEditing(true); setNotice(""); }} className="flex-none rounded-xl bg-card px-3 py-1.5 text-xs font-bold text-primary hover:bg-accent/30">Add people</button>
        )}
      </div>

      {notice && <p role="status" className="mt-3 rounded-xl bg-[#2E9E6B]/8 px-3 py-2 text-xs font-semibold text-[#23885A]">{notice}</p>}

      {members.length === 0 ? (
        editing ? editor : (
          <div className="mt-4 rounded-2xl border border-dashed border-accent bg-card/40 p-5 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-primary"><Icon name="users" className="h-6 w-6" /></span>
            <p className="mt-3 text-sm font-bold">Add your class list</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">Paste names (and matric numbers) and Kolekt ticks people off as Paga confirms their payments.</p>
            <Button size="md" className="mx-auto mt-4 max-w-[220px]" onClick={() => setEditing(true)}><Icon name="plus" className="h-4 w-4" /> Add list</Button>
          </div>
        )
      ) : (
        <>
          <div className="mt-4">
            <div className="flex items-end justify-between">
              <p className="text-sm"><b className="text-2xl font-extrabold">{paid.length}</b> <span className="text-muted">of {members.length} paid</span></p>
              <p className="text-xs font-bold text-primary">{pct}%</p>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-accent/40" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Members paid">
              <div className="h-full rounded-full bg-gradient-to-r from-[#9468EE] to-primary transition-[width] duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {editing && editor}

          {owing.length > 0 && !editing && (
            <div className="mt-4">
              {!remind ? (
                <button onClick={() => setRemind(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366]/12 text-sm font-bold text-[#128C4A] transition hover:bg-[#25D366]/20">
                  <Icon name="bell" className="h-4 w-4" /> Remind {owing.length} unpaid on WhatsApp
                </button>
              ) : (
                <div className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-3.5">
                  <p className="text-xs font-bold text-[#128C4A]">Reminder message</p>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 font-sans text-xs leading-relaxed text-ink">{groupMessage}</pre>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <a href={`https://wa.me/?text=${encodeURIComponent(groupMessage)}`} target="_blank" rel="noreferrer"
                      className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-sm font-bold text-white hover:bg-[#1FB959]">
                      <Icon name="share" className="h-4 w-4" /> Send to group
                    </a>
                    <button onClick={copy} className="h-11 rounded-2xl bg-white text-xs font-bold text-ink ring-1 ring-card hover:ring-primary">{copied ? "Copied" : "Copy"}</button>
                  </div>
                  <button onClick={() => setRemind(false)} className="mt-2 w-full text-center text-[11px] font-semibold text-muted hover:text-ink">Close</button>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-1 rounded-2xl bg-bg p-1 text-xs font-bold">
            {([["unpaid", `Unpaid (${owing.length})`], ["paid", `Paid (${paid.length})`], ...(notOnList.length ? [["stranger", `Not on list (${notOnList.length})`]] : [])] as [Tab, string][]).map(([k, label]) => (
              <button key={k} onClick={() => { setTab(k); setLimit(PAGE); }}
                className={`flex-1 rounded-xl px-2 py-2 transition ${tab === k ? "bg-white text-primary shadow-sm" : "text-muted hover:text-ink"}`}>{label}</button>
            ))}
          </div>

          {tab !== "stranger" && members.length > 8 && (
            <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} placeholder="Search name or ID"
              className="mt-3 h-10 w-full rounded-xl border border-card bg-bg px-3 text-sm outline-none focus:border-primary focus:bg-white" />
          )}

          {tab === "stranger" ? (
            <ul className="mt-2 divide-y divide-card">
              {notOnList.map((s, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{s.name}</p><p className="text-[11px] text-muted">Paid {timeAgo(s.lastPaid)} · not on your list</p></div>
                  <p className="text-sm font-bold">{naira(s.paid)}</p>
                </li>
              ))}
            </ul>
          ) : list.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{query ? "No one matches that search." : tab === "unpaid" ? "Everyone has paid 🎉" : "No one has paid yet."}</p>
          ) : (
            <ul className="mt-2 divide-y divide-card">
              {list.slice(0, limit).map((m) => (
                <li key={m.id} className="group flex items-center gap-3 py-2.5">
                  <span className={`grid h-9 w-9 flex-none place-items-center rounded-full text-xs font-bold ${m.status === "paid" ? "bg-[#2E9E6B]/15 text-[#23885A]" : "bg-card text-muted"}`}>
                    {m.status === "paid" ? <Icon name="check" className="h-4 w-4" width={3} /> : m.name[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.name}</p>
                    <p className="truncate text-[11px] text-muted">
                      {m.memberId ?? (m.phone ? m.phone : "No ID")}
                      {m.status === "part" && <span className="font-semibold text-[#A86B12]"> · part paid {naira(m.paid)}</span>}
                      {m.status === "paid" && m.lastPaid && <> · paid {timeAgo(m.lastPaid)}</>}
                    </p>
                  </div>
                  {m.status === "paid" ? (
                    <p className="text-sm font-bold">{naira(m.paid)}</p>
                  ) : m.phone ? (
                    <a href={`https://wa.me/${intlPhone(m.phone)}?text=${encodeURIComponent(personalMessage(m.name))}`} target="_blank" rel="noreferrer"
                      className="rounded-xl bg-[#25D366]/12 px-2.5 py-1.5 text-[11px] font-bold text-[#128C4A] hover:bg-[#25D366]/20">Remind</a>
                  ) : null}
                  <button onClick={() => remove(m.id, m.name)} aria-label={`Remove ${m.name}`} className="grid h-7 w-7 flex-none place-items-center rounded-lg text-muted opacity-0 transition hover:bg-bg hover:text-[#C2344D] focus:opacity-100 group-hover:opacity-100">
                    <Icon name="x" className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tab !== "stranger" && list.length > limit && (
            <button onClick={() => setLimit((l) => l + 50)} className="mt-1 w-full rounded-xl py-2.5 text-sm font-semibold text-primary hover:bg-bg">Show more ({list.length - limit} left)</button>
          )}
          <button onClick={clear} className="mt-3 text-[11px] font-semibold text-muted hover:text-[#C2344D]">Clear list</button>
        </>
      )}
    </Card>
  );
}
