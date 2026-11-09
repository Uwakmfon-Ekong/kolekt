"use client";

import { useParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import WalletIllustration from "@/components/WalletIllustration";
import { useApp } from "@/lib/create-collection";
import { naira } from "@/lib/data";

export default function PublicCollectionPage() {
  const params = useParams<{ slug: string }>();
  const { collections, hydrated } = useApp();
  const collection = useMemo(() => collections.find((item) => item.slug === params.slug), [collections, params.slug]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  if (!hydrated) return <main className="grid min-h-screen place-items-center bg-bg text-sm font-semibold text-muted">Loading collection…</main>;
  if (!collection || collection.status !== "Active") return <main className="grid min-h-screen place-items-center bg-bg px-5"><div className="max-w-sm rounded-3xl border border-card bg-white p-8 text-center shadow-soft"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-card text-primary"><Icon name="inbox" className="h-7 w-7" /></span><h1 className="mt-4 text-xl font-extrabold">Collection not found</h1><p className="mt-2 text-sm text-muted">This collection may have been closed or the link may be incorrect.</p><a href="/" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Go to Kolekt</a></div></main>;

  const fields = collection.contributorFields?.length ? collection.contributorFields : ["Full Name"];
  const fixed = collection.contributionType === "fixed";
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const missing = fields.filter((field) => !values[field]?.trim());
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
    setMessage("This is a frontend prototype. Payment is simulated, so no money has been charged.");
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
              {collection.target > 0 ? <><p className="text-xs font-semibold text-muted">Target amount</p><p className="mt-1 text-2xl font-extrabold">{naira(collection.target)}</p><p className="mt-1 text-xs text-muted">{naira(collection.collected)} collected so far</p><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-accent/50"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round((collection.collected / collection.target) * 100))}%` }} /></div></> : <p className="text-sm font-semibold">No overall target set</p>}
            </div>
            <dl className="grid grid-cols-2 gap-3">{[{ label: "Contribution", value: fixed ? naira(collection.contributionAmount || 0) : "Flexible amount" }, { label: "Deadline", value: collection.deadline ? new Date(`${collection.deadline}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "No deadline" }].map((x) => <div key={x.label} className="rounded-2xl border border-card p-3.5"><dt className="text-xs font-semibold text-muted">{x.label}</dt><dd className="mt-1 text-sm font-bold">{x.value}</dd></div>)}</dl>
            <form onSubmit={submit} className="space-y-4">
              <div><h2 className="text-base font-extrabold">Your information</h2><p className="mt-1 text-xs text-muted">Please provide the details requested by the organiser.</p></div>
              {fields.map((field) => <label key={field} className="block"><span className="mb-1.5 block text-xs font-bold">{field} <span className="text-primary">*</span></span><input required value={values[field] || ""} onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))} placeholder={`Enter ${field.toLowerCase()}`} className="h-12 w-full rounded-xl border border-card bg-bg px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></label>)}
              {!fixed && <label className="block"><span className="mb-1.5 block text-xs font-bold">Contribution amount (₦) *</span><input required inputMode="numeric" value={values.amount || ""} onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value.replace(/\D/g, "") }))} placeholder={collection.minimumContribution ? `Minimum ${naira(collection.minimumContribution)}` : "Enter amount"} className="h-12 w-full rounded-xl border border-card bg-bg px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></label>}
              <button type="submit" className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-cta">Proceed to simulated payment <Icon name="chevron" className="h-4 w-4" /></button>
              {message && <p role="status" className="rounded-xl bg-accent/20 p-3 text-xs font-medium leading-relaxed text-ink">{message}</p>}
              <p className="text-center text-[11px] text-muted">Prototype only · no real payment is processed.</p>
            </form>
          </div>
        </article>
        <p className="mt-5 text-center text-xs text-muted">Powered by <b className="text-ink">Kolekt</b> · Collect. Track. Stay Transparent.</p>
      </div>
    </main>
  );
}
