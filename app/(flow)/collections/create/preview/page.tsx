"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Icon, { IconName } from "@/components/Icon";
import Logo from "@/components/Logo";
import WalletIllustration from "@/components/WalletIllustration";
import { Button, LinkButton } from "@/components/Button";
import FlowFooter from "@/components/FlowFooter";
import { type CollectionDraft, useCreateCollection } from "@/lib/create-collection";

const DETAILS = "/collections/create/details";
const CONTRIBUTION = "/collections/create/contribution-type";
const FIELDS = "/collections/create/contributor-fields";
const money = (v: string | number) => "₦" + Number(v || 0).toLocaleString("en-NG");
const slugify = (s: string) => s.toLowerCase().trim().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
const makeToken = (length: number) => {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function fieldIcon(label: string): IconName {
  const l = label.toLowerCase();
  if (l.includes("email")) return "mail";
  if (l.includes("phone")) return "phone";
  if (l.includes("name")) return "user";
  return "hash";
}

function dateLabel(iso: string) {
  if (!iso) return "No deadline set";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

function validate(d: CollectionDraft) {
  const issues: { label: string; href: string }[] = [];
  if (d.name.trim().length < 3) issues.push({ label: "Collection name (at least 3 characters)", href: DETAILS });
  if (d.description.trim().length < 10) issues.push({ label: "Description (at least 10 characters)", href: DETAILS });
  if (!d.organisation.trim()) issues.push({ label: "Organisation name", href: DETAILS });
  if (!d.type) issues.push({ label: "Contribution type", href: CONTRIBUTION });
  if (d.type === "fixed" && !(Number(d.amount) > 0)) issues.push({ label: "A valid fixed contribution amount", href: CONTRIBUTION });
  if (d.type === "flexible" && d.minimum && !(Number(d.minimum) > 0)) issues.push({ label: "A valid minimum contribution", href: CONTRIBUTION });
  if (d.type === "flexible" && d.target && !(Number(d.target) > 0)) issues.push({ label: "A valid target amount", href: CONTRIBUTION });
  if (d.type === "flexible" && d.minimum && d.target && Number(d.minimum) > Number(d.target)) issues.push({ label: "Minimum contribution cannot exceed the target", href: CONTRIBUTION });
  if (d.deadline) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const deadline = new Date(`${d.deadline}T00:00:00`);
    if (Number.isNaN(deadline.getTime()) || deadline < today) issues.push({ label: "A deadline that is today or in the future", href: CONTRIBUTION });
  }
  if (!d.contributorFields.includes("Full Name")) issues.push({ label: "Full Name as a contributor field", href: FIELDS });
  return issues;
}

export default function PreviewPage() {
  const router = useRouter();
  const { draft, setPublished, addCollection, collections, user } = useCreateCollection();
  const [issues, setIssues] = useState<ReturnType<typeof validate>>([]);
  const [busy, setBusy] = useState(false);

  const fixed = draft.type === "fixed";
  const target = Number(draft.target) || 0;
  const minimum = Number(draft.minimum) || 0;
  const amount = Number(draft.amount) || 0;
  const slugBase = useMemo(() => slugify(draft.name) || "my-collection", [draft.name]);
  const publicSlug = `${slugBase}-${makeToken(5)}`;

  const publish = () => {
    const invalid = validate(draft);
    setIssues(invalid);
    if (invalid.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setBusy(true);

    const existingIds = new Set(collections.map((c) => c.id));
    let id = `klk-${makeToken(8)}`;
    while (existingIds.has(id)) id = `klk-${makeToken(8)}`;

    const existingSlugs = new Set(collections.map((c) => c.slug).filter(Boolean));
    let slug = publicSlug;
    while (existingSlugs.has(slug)) slug = `${slugBase}-${makeToken(5)}`;
    const existingPublicIds = new Set(collections.map((c) => c.collectionId).filter(Boolean));
    let collectionId = `KLK-${makeToken(8).toUpperCase()}`;
    while (existingPublicIds.has(collectionId)) collectionId = `KLK-${makeToken(8).toUpperCase()}`;

    const fullCollection = {
      id,
      collectionId,
      publicationStatus: "ACTIVE" as const,
      slug,
      url: `${window.location.host}/c/${slug}`,
      name: draft.name.trim(),
      icon: "wallet" as const,
      image: draft.image,
      collected: 0,
      target,
      status: "Active" as const,
      due: draft.deadline ? `Due ${dateLabel(draft.deadline)}` : "No deadline",
      organisation: draft.organisation.trim(),
      organiserName: user.name,
      description: draft.description.trim(),
      contribution: fixed ? `Fixed · ${money(amount)} per person` : "Flexible · contributors choose an amount",
      contributionType: draft.type!,
      contributionAmount: fixed ? amount : undefined,
      minimumContribution: fixed ? undefined : minimum || undefined,
      deadline: draft.deadline || undefined,
      allowAboveTarget: draft.allowAboveTarget,
      contributorFields: [...draft.contributorFields],
    };

    addCollection(fullCollection);
    setPublished({
      id: fullCollection.collectionId,
      url: `${window.location.origin}/c/${slug}`,
      slug,
      name: fullCollection.name,
      status: "Active",
      publishedAt: new Date().toISOString(),
    });
    router.push("/collections/published");
  };

  const details = [
    { label: "Contribution type", value: fixed ? "Fixed amount" : "Flexible amount" },
    ...(fixed ? [{ label: "Required contribution", value: money(amount) }] : minimum ? [{ label: "Minimum contribution", value: money(minimum) }] : []),
    { label: "Target amount", value: target ? money(target) : "No target set" },
    { label: "Deadline", value: dateLabel(draft.deadline) },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden pb-40">
      <div className="pointer-events-none fixed -right-28 -top-32 h-80 w-80 rounded-full bg-accent/35" />
      <div className="pointer-events-none fixed -bottom-20 -left-24 h-56 w-56 rounded-full bg-card" />

      <div className="relative mx-auto max-w-2xl px-5 pt-[max(env(safe-area-inset-top),12px)] md:pt-10">
        <header className="flex min-h-14 items-center justify-between gap-3">
          <Link href={FIELDS} aria-label="Back" className="grid h-11 w-11 flex-none place-items-center rounded-2xl border border-accent/40 bg-white text-ink shadow-sm hover:text-primary"><Icon name="back" /></Link>
          <Logo size={30} />
          <span className="w-11" />
        </header>
        <div className="mt-5" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={4} aria-label="Step 4 of 4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold"><span className="text-primary">Step 4 of 4</span><span className="text-muted">Final review</span></div>
          <div className="grid grid-cols-4 gap-1.5">{[1, 2, 3, 4].map((n) => <i key={n} className="h-1.5 rounded-full bg-primary" />)}</div>
        </div>

        <div className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Almost there</p>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Review Collection</h1>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">Check the details below. This is how your collection will appear to contributors.</p>
        </div>

        {issues.length > 0 && <div role="alert" className="mt-5 rounded-2xl border border-[#C2344D]/30 bg-[#C2344D]/5 p-4 text-sm">
          <p className="font-bold text-[#C2344D]">A few things need your attention</p>
          <ul className="mt-2 space-y-1.5">{issues.map((item) => <li key={item.label}>• <Link className="font-semibold text-primary underline" href={item.href}>{item.label}</Link></li>)}</ul>
        </div>}

        <article className="mt-5 overflow-hidden rounded-[30px] border border-accent/35 bg-white shadow-soft" aria-label="Public collection preview">
          <div className="flex items-center gap-2.5 border-b border-card bg-bg px-4 py-3"><Logo size={26} /><span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-muted ring-1 ring-card"><Icon name="globe" className="h-3 w-3" /> Public page preview</span></div>
          <div className="relative grid h-52 place-items-center overflow-hidden bg-gradient-to-br from-[#E8DDF0] via-[#DCCDEB] to-accent">
            {draft.image ? <img src={draft.image} alt={`${draft.name} collection cover`} className="absolute inset-0 h-full w-full object-cover" /> : <WalletIllustration className="h-48 w-auto max-w-none" />}
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-primary shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Ready to publish</span>
          </div>
          <div className="space-y-6 p-5 md:p-7">
            <div>
              <h2 className="text-[26px] font-extrabold leading-tight tracking-tight">{draft.name || "Untitled collection"}</h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-primary text-sm font-bold text-white">{initials(draft.organisation || "Organisation")}</span>
                <div className="min-w-0"><p className="text-sm text-muted">Organised by <b className="text-ink">{draft.organisation || "Organisation not added"}</b></p><p className="mt-0.5 text-xs text-muted">Organiser: {user.name}</p></div>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink/90">{draft.description || "No description added."}</p>
            <div className="rounded-3xl bg-card p-5">
              {target > 0 ? <><p className="text-xs font-semibold text-muted">Collection target</p><p className="mt-1 text-[27px] font-extrabold tracking-tight">{money(target)}</p><p className="mt-1 text-xs text-muted">No contributions received yet</p><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-accent/50"><div className="h-full w-0 rounded-full bg-primary" /></div></> : <><p className="text-sm font-bold">{fixed ? "Contribution collection" : "Open contribution collection"}</p><p className="mt-1 text-xs text-muted">No overall target has been set.</p></>}
            </div>
            <section>
              <h3 className="text-sm font-extrabold">Collection information</h3>
              <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{details.map((item) => <div key={item.label} className="rounded-2xl border border-card bg-white p-3.5"><dt className="text-xs font-semibold text-muted">{item.label}</dt><dd className="mt-1 text-sm font-bold">{item.value}</dd></div>)}</dl>
            </section>
            <section aria-labelledby="required-fields-heading">
              <h3 id="required-fields-heading" className="text-sm font-extrabold">Contributor information required</h3>
              <p className="mt-1 text-xs text-muted">Contributors will be asked to provide:</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">{draft.contributorFields.map((field) => <li key={field} className="flex items-center gap-3 rounded-2xl bg-bg px-3.5 py-3 text-sm font-semibold"><span className="grid h-8 w-8 flex-none place-items-center rounded-xl bg-white text-primary shadow-sm"><Icon name={fieldIcon(field)} className="h-4 w-4" /></span>{field}<Icon name="check" className="ml-auto h-4 w-4 text-primary" /></li>)}</ul>
            </section>
            <div><button type="button" disabled className="flex h-14 w-full cursor-not-allowed items-center justify-center rounded-[18px] bg-gradient-to-b from-[#8553E6] to-primary text-base font-bold text-white opacity-90 shadow-cta">{fixed ? `Contribute ${money(amount)}` : "Choose contribution amount"}</button><p className="mt-2 text-center text-xs text-muted">Preview only · payments will be simulated in this prototype</p></div>
          </div>
        </article>

        <section className="mt-5 rounded-3xl border border-accent/35 bg-card/80 p-5">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-white text-primary"><Icon name="shield" className="h-5 w-5" /></span><div><h2 className="text-sm font-extrabold">Payment information</h2><p className="mt-1 text-sm leading-relaxed text-muted">Payments are simulated in this frontend prototype. No real payment will be processed, and you don’t need to provide or display bank account details.</p></div></div>
        </section>

        <section className="mt-5 rounded-3xl border border-accent/30 bg-white p-4 shadow-soft">
          <h2 className="px-1 text-sm font-extrabold">Want to make a change?</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Link href={DETAILS} className="flex items-center justify-between gap-2 rounded-2xl bg-bg px-3.5 py-3 text-sm font-bold hover:bg-card"><span>Edit Details</span><Icon name="edit" className="h-4 w-4 text-primary" /></Link>
            <Link href={CONTRIBUTION} className="flex items-center justify-between gap-2 rounded-2xl bg-bg px-3.5 py-3 text-sm font-bold hover:bg-card"><span>Edit Contribution</span><Icon name="edit" className="h-4 w-4 text-primary" /></Link>
            <Link href={FIELDS} className="flex items-center justify-between gap-2 rounded-2xl bg-bg px-3.5 py-3 text-sm font-bold hover:bg-card"><span>Edit Contributor Fields</span><Icon name="edit" className="h-4 w-4 text-primary" /></Link>
          </div>
        </section>
      </div>

      <FlowFooter className="grid-cols-[1fr_1.5fr]">
        <LinkButton href={FIELDS} variant="secondary">Back</LinkButton>
        <Button onClick={publish} loading={busy} loadingText="Publishing…">Publish Collection</Button>
      </FlowFooter>
    </div>
  );
}
