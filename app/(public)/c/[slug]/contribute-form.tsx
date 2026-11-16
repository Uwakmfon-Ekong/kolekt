"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import WalletIllustration from "@/components/WalletIllustration";
import { naira, timeAgo, type Collection } from "@/lib/data";
import { startContributionAction } from "@/app/actions/checkout";
import CheckPayment from "@/components/CheckPayment";

/** The field people are identified by, in the same order the server uses. */
function idField(fields: string[]) {
  return fields.find((f) => /matric|reg(istration)?\b|reg\.|member|staff|student id|id number/i.test(f))
    ?? fields.find((f) => /phone|mobile|whatsapp/i.test(f))
    ?? fields.find((f) => /e-?mail/i.test(f))
    ?? "Full Name";
}

function inputType(field: string) {
  const f = field.toLowerCase();
  if (f.includes("email")) return { type: "email", inputMode: "email" as const, autoComplete: "email" };
  if (f.includes("phone")) return { type: "tel", inputMode: "tel" as const, autoComplete: "tel" };
  if (f === "full name") return { type: "text", inputMode: "text" as const, autoComplete: "name" };
  return { type: "text", inputMode: "text" as const, autoComplete: "off" };
}

const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "600 Level", "Postgraduate", "Other"];
const DEPARTMENTS = [
  "Accounting", "Agricultural Economics", "Architecture", "Banking and Finance", "Biochemistry", "Botany", "Business Administration",
  "Chemical Engineering", "Chemistry", "Civil Engineering", "Computer Engineering", "Computer Science", "Economics", "Education",
  "Electrical/Electronics Engineering", "English", "Geography", "Geology", "History", "Law", "Linguistics", "Marketing",
  "Mass Communication", "Mathematics", "Mechanical Engineering", "Medicine and Surgery", "Microbiology", "Nursing", "Pharmacy",
  "Philosophy", "Physics", "Political Science", "Psychology", "Public Administration", "Sociology", "Statistics", "Zoology",
];
const fieldClass = "h-12 w-full rounded-xl border border-card bg-bg px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

type Progress = { total: number; paid: number } | null;
type Supporter = { name: string; at: string };

export default function ContributeForm({ collection, progress, supporters }: { collection: Collection | null; progress: Progress; supporters: Supporter[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Live: totals and the contributor list refresh on their own while the page is open.
  useEffect(() => {
    if (!collection || collection.status !== "Active") return;
    const id = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 15000);
    return () => clearInterval(id);
  }, [collection, router]);

  if (!collection || collection.status !== "Active") return <main className="grid min-h-screen place-items-center bg-bg px-5 py-10"><div className="w-full max-w-sm"><div className="rounded-3xl border border-card bg-white p-8 text-center shadow-soft"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-card text-primary"><Icon name="inbox" className="h-7 w-7" /></span><h1 className="mt-4 text-xl font-extrabold">{collection ? "This collection is closed" : "Collection not found"}</h1><p className="mt-2 text-sm text-muted">{collection ? `${collection.name} is no longer accepting contributions. ${naira(collection.collected)} was collected.` : "The link may be incorrect. Check it with the person who shared it."}</p><a href="/" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Go to Kolekt</a></div>{collection?.slug && <div className="mt-4 text-left"><CheckPayment slug={collection.slug} idLabel={idField(collection.contributorFields ?? ["Full Name"])} /></div>}</div></main>;

  const fields = collection.contributorFields?.length ? collection.contributorFields : ["Full Name"];
  const fixed = collection.contributionType === "fixed";
  const optional = new Set(collection.optionalFields ?? []);
  const part = fixed && collection.allowPartPayments;
  const full = collection.contributionAmount || 0;
  const payNow = part && values.amount !== undefined ? Number(values.amount || 0) : full;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const missing = fields.filter((field) => !values[field]?.trim() && !optional.has(field));
    if (missing.length) {
      setMessage(`Please complete: ${missing.join(", ")}.`);
      return;
    }
    if (!fixed) {
      const amount = Number(values.amount || 0);
      if (amount <= 0) { setMessage("Enter a contribution amount greater than ₦0."); return; }
      if (collection.minimumContribution && amount < collection.minimumContribution) {
        setMessage(`The minimum contribution is ${naira(collection.minimumContribution)}.`);
        return;
      }
    }
    if (part && (!payNow || payNow > full)) { setMessage(`Enter an amount up to ${naira(full)}.`); return; }
    setBusy(true);
    try {
      const res = await startContributionAction({ slug: collection.slug!, values, amount: fixed ? (part ? payNow : undefined) : Number(values.amount || 0) });
      if (!res.ok) { setMessage(res.error); setBusy(false); return; }
      router.push(`/pay/${res.reference}`);
    } catch {
      setMessage("We couldn’t reach Kolekt. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg px-4 pb-12 pt-5 sm:px-6">
      <div className="mx-auto max-w-xl">
        <header className="flex items-center justify-between"><Logo size={34} /><span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary ring-1 ring-card">Public collection</span></header>
        <article className="mt-6 overflow-hidden rounded-[30px] border border-accent/35 bg-white shadow-soft">
          <div className="relative grid h-52 place-items-center overflow-hidden bg-gradient-to-br from-[#E8DDF0] via-[#DCCDEB] to-accent">
            {collection.image ? <img src={collection.image} alt={collection.name} className="absolute inset-0 h-full w-full object-cover" /> : <WalletIllustration className="h-48 w-auto" />}
            <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-primary">{collection.status}</span>
          </div>
          <div className="space-y-5 p-5 sm:p-7">
            <div><h1 className="text-[27px] font-extrabold leading-tight tracking-tight">{collection.name}</h1><div className="mt-3 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-white">{(collection.organisation || "K").split(/\s+/).slice(0,2).map((x) => x[0]).join("").toUpperCase()}</span><p className="text-sm text-muted">Organised by <b className="text-ink">{collection.organisation}</b></p></div><p className="mt-1 text-xs text-muted">Organiser: {collection.organiserName || "Kolekt organiser"}</p></div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/90">{collection.description}</p>
            <div className="rounded-3xl bg-card p-5">
              {collection.target > 0 ? <><p className="text-xs font-semibold text-muted">Target amount</p><p className="mt-1 text-2xl font-extrabold">{naira(collection.target)}</p><p className="mt-1 text-xs text-muted">{naira(collection.collected)} collected so far{collection.contributors ? ` · ${collection.contributors} contribution${collection.contributors === 1 ? "" : "s"}` : ""}</p><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-accent/50"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round((collection.collected / collection.target) * 100))}%` }} /></div></> : <><p className="text-xs font-semibold text-muted">Collected so far</p><p className="mt-1 text-2xl font-extrabold">{naira(collection.collected)}</p><p className="mt-1 text-xs text-muted">{collection.contributors ? `${collection.contributors} contribution${collection.contributors === 1 ? "" : "s"} so far` : "Be the first to contribute"}</p></>}
            </div>
            {progress && (
              <div className="rounded-3xl border border-card p-5">
                <div className="flex items-end justify-between gap-3">
                  <p className="text-sm"><b className="text-2xl font-extrabold">{progress.paid}</b> <span className="text-muted">of {progress.total} have paid</span></p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#2E9E6B]/12 px-2.5 py-1 text-[11px] font-bold text-[#23885A]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2E9E6B]" /> Live</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-accent/40" role="progressbar" aria-valuenow={Math.round((progress.paid / progress.total) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="People paid">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#9468EE] to-primary transition-[width] duration-700" style={{ width: `${Math.round((progress.paid / progress.total) * 100)}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">{progress.total - progress.paid > 0 ? `${progress.total - progress.paid} to go. Don’t be the last one 😅` : "Everyone has paid 🎉"}</p>
              </div>
            )}
            {supporters.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-muted"><Icon name="shield" className="h-3.5 w-3.5 text-primary" /> Recent contributors · verified by Paga</p>
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {supporters.map((s, i) => (
                    <li key={i} className="inline-flex items-center gap-1.5 rounded-full bg-card/70 py-1 pl-1 pr-3 text-xs font-semibold">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] font-bold text-primary">{s.name[0]}</span>
                      {s.name} <span className="font-medium text-muted">· {timeAgo(s.at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <dl className="grid grid-cols-2 gap-3">{[{ label: "Contribution", value: fixed ? `${naira(full)}${part ? " · part payments OK" : ""}` : "Flexible amount" }, { label: "Deadline", value: collection.deadline ? new Date(`${collection.deadline}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "No deadline" }].map((x) => <div key={x.label} className="rounded-2xl border border-card p-3.5"><dt className="text-xs font-semibold text-muted">{x.label}</dt><dd className="mt-1 text-sm font-bold">{x.value}</dd></div>)}</dl>
            <CheckPayment slug={collection.slug!} idLabel={idField(fields)} />
            <form onSubmit={submit} className="space-y-4">
              <div><h2 className="text-base font-extrabold">Your information</h2><p className="mt-1 text-xs text-muted">Please provide the details requested by the organiser.</p></div>
              {fields.map((field) => {
                const req = !optional.has(field);
                const set = (val: string) => setValues((v) => ({ ...v, [field]: val }));
                const label = <span className="mb-1.5 block text-xs font-bold">{field} {req ? <span className="text-primary">*</span> : <span className="font-medium text-muted">(optional)</span>}</span>;
                if (/\blevel\b/i.test(field)) return (
                  <label key={field} className="block">{label}
                    <select required={req} value={values[field] || ""} onChange={(e) => set(e.target.value)} className={`${fieldClass} ${values[field] ? "" : "text-muted"}`}>
                      <option value="">Select your level</option>
                      {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </label>
                );
                const dept = /department|dept/i.test(field);
                return (
                  <label key={field} className="block">{label}
                    <input required={req} {...inputType(field)} maxLength={120} list={dept ? "kolekt-departments" : undefined} value={values[field] || ""} onChange={(e) => set(e.target.value)} placeholder={dept ? "Start typing, e.g. Computer Science" : `Enter ${field.toLowerCase()}`} className={fieldClass} />
                  </label>
                );
              })}
              <datalist id="kolekt-departments">{DEPARTMENTS.map((d) => <option key={d} value={d} />)}</datalist>
              {part && (
                <label className="block"><span className="mb-1.5 block text-xs font-bold">Amount you’re paying now (₦) *</span>
                  <input required inputMode="numeric" value={values.amount ?? String(full)} onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value.replace(/\D/g, "") }))} className={fieldClass} />
                  <span className="mt-1.5 block text-[11px] leading-relaxed text-muted">The full amount is {naira(full)}. Paying in parts? Enter what you can now; Kolekt keeps track of your balance.</span>
                </label>
              )}
              {!fixed && <label className="block"><span className="mb-1.5 block text-xs font-bold">Contribution amount (₦) *</span><input required inputMode="numeric" value={values.amount || ""} onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value.replace(/\D/g, "") }))} placeholder={collection.minimumContribution ? `Minimum ${naira(collection.minimumContribution)}` : "Enter amount"} className="h-12 w-full rounded-xl border border-card bg-bg px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></label>}
              <button type="submit" disabled={busy} aria-busy={busy || undefined} className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-cta transition hover:bg-primary-dark disabled:opacity-80">{busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Getting your account number…</> : <>{fixed ? `Pay ${naira(payNow)}` : "Continue to payment"} <Icon name="chevron" className="h-4 w-4" /></>}</button>
              {message && <p role="alert" className="rounded-xl bg-[#C2344D]/8 p-3 text-xs font-medium leading-relaxed text-[#C2344D]">{message}</p>}
              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted"><Icon name="shield" className="h-3.5 w-3.5 text-primary" /> Secured by Paga · no account or app needed</p>
            </form>
          </div>
        </article>
        <p className="mt-5 text-center text-xs text-muted">Powered by <b className="text-ink">Kolekt</b> · Collect. Track. Stay Transparent.</p>
      </div>
    </main>
  );
}
