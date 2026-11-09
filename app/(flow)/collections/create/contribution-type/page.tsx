"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import StepHeader from "@/components/StepHeader";
import { Button, LinkButton } from "@/components/Button";
import FlowFooter from "@/components/FlowFooter";
import { CollectionDraft, ContributionType, useCreateCollection } from "@/lib/create-collection";

type Key = "type" | "amount" | "minimum" | "target" | "deadline";
type Errors = Partial<Record<Key, string>>;

const digits = (v: string) => v.replace(/\D/g, "");
const fmt = (v: string) => (v ? Number(v).toLocaleString("en-NG") : "");
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function validate(d: CollectionDraft, today: string): Errors {
  const e: Errors = {};
  if (!d.type) e.type = "Choose a contribution type to continue.";
  if (d.type === "fixed") {
    if (!d.amount) e.amount = "Enter the contribution amount.";
    else if (Number(d.amount) <= 0) e.amount = "Amount must be greater than ₦0.";
  }
  if (d.type === "flexible") {
    if (d.minimum && Number(d.minimum) <= 0) e.minimum = "Minimum must be greater than ₦0.";
    if (d.target && Number(d.target) <= 0) e.target = "Target must be greater than ₦0.";
    if (!e.minimum && !e.target && d.minimum && d.target && Number(d.minimum) > Number(d.target))
      e.minimum = "Minimum can’t be more than the target amount.";
  }
  if (d.deadline && today && d.deadline < today) e.deadline = "Deadline can’t be in the past.";
  return e;
}

const base = "w-full rounded-2xl border-[1.5px] bg-bg text-[15.5px] font-semibold outline-none transition placeholder:font-medium placeholder:text-[#B1A8B8] focus:bg-white focus:ring-4";
const ok = "border-card focus:border-primary focus:ring-primary/10";
const bad = "border-[#C2344D] focus:border-[#C2344D] focus:ring-[#C2344D]/10";

function Msg({ error, hint }: { error?: string; hint?: string }) {
  if (error) return <p role="alert" className="mt-1.5 px-0.5 text-xs font-medium text-[#C2344D]">{error}</p>;
  if (hint) return <p className="mt-1.5 px-0.5 text-xs text-muted">{hint}</p>;
  return null;
}

function MoneyField({ id, label, value, onChange, placeholder, error, optional, hint }: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder: string; error?: string; optional?: boolean; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold">
        {label}{optional && <span className="font-medium text-muted"> (optional)</span>}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15.5px] font-bold text-primary">₦</span>
        <input id={id} inputMode="numeric" autoComplete="off" value={fmt(value)} onChange={(e) => onChange(digits(e.target.value))} placeholder={placeholder} aria-invalid={!!error}
          className={`${base} h-[54px] pl-9 pr-4 ${error ? bad : ok}`} />
      </div>
      <Msg error={error} hint={hint} />
    </div>
  );
}

function TypeCard({ selected, onSelect, icon, title, desc, children }: {
  selected: boolean; onSelect: () => void; icon: React.ReactNode; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-3xl border-2 transition ${selected ? "border-primary bg-white shadow-soft" : "border-card bg-card/60 hover:border-accent"}`}>
      <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className="flex w-full items-start gap-4 rounded-3xl p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <span className={`grid h-14 w-14 flex-none place-items-center rounded-2xl transition ${selected ? "bg-primary text-white shadow-cta" : "bg-white text-primary shadow-sm"}`}>{icon}</span>
        <span className="min-w-0 flex-1 pt-0.5">
          <span className="block text-[17px] font-bold">{title}</span>
          <span className="mt-0.5 block text-sm text-muted">{desc}</span>
        </span>
        <span className={`mt-1 grid h-7 w-7 flex-none place-items-center rounded-full border-2 transition ${selected ? "border-primary bg-primary text-white" : "border-accent bg-white"}`}>
          {selected && <Icon name="check" className="h-4 w-4" width={3.2} />}
        </span>
      </button>
      {selected && <div className="reveal space-y-4 px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function ContributionTypePage() {
  const router = useRouter();
  const { draft, update } = useCreateCollection();
  const [errors, setErrors] = useState<Errors>({});
  const [today, setToday] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setToday(localToday()), []);

  const change = (patch: Partial<CollectionDraft>) => {
    update(patch);
    const keys = Object.keys(patch);
    if (keys.some((k) => errors[k as Key])) {
      const next = validate({ ...draft, ...patch }, today);
      setErrors((e) => { const n = { ...e }; keys.forEach((k) => { if (k in n) n[k as Key] = next[k as Key]; }); return n; });
    }
  };
  const pick = (type: ContributionType) => { update({ type }); setErrors({}); };

  const next = () => {
    const e = validate(draft, today);
    setErrors(e);
    const first = (["type", "amount", "minimum", "target", "deadline"] as const).find((k) => e[k]);
    if (first) {
      const el = document.getElementById(first === "type" ? "types" : first);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return (el as HTMLElement | null)?.focus?.();
    }
    setBusy(true);
    setTimeout(() => router.push("/collections/create/contributor-fields"), 500);
  };

  return (
    <div className="relative min-h-screen overflow-hidden pb-40">
      <div className="pointer-events-none fixed -right-28 -top-32 h-80 w-80 rounded-full bg-accent/35" />
      <div className="pointer-events-none fixed -bottom-20 -left-24 h-56 w-56 rounded-full bg-card" />

      <div className="relative mx-auto max-w-xl px-5 pt-[max(env(safe-area-inset-top),12px)] md:pt-10">
        <StepHeader step={2} backHref="/collections/create/details" />

        <div className="mt-7">
          <h2 className="text-2xl font-extrabold tracking-tight">Contribution Type</h2>
          <p className="mt-1.5 text-[15px] text-muted">Choose how contributors will contribute to your collection.</p>
        </div>

        <div id="types" tabIndex={-1} role="radiogroup" aria-label="Contribution type" className="mt-6 space-y-4 outline-none">
          <TypeCard selected={draft.type === "fixed"} onSelect={() => pick("fixed")} title="Fixed Amount" desc="Everyone pays the same amount."
            icon={<span className="text-[26px] font-extrabold leading-none">₦</span>}>
            <MoneyField id="amount" label="Contribution Amount" placeholder="Enter amount" value={draft.amount} onChange={(v) => change({ amount: v })} error={errors.amount} />
          </TypeCard>

          <TypeCard selected={draft.type === "flexible"} onSelect={() => pick("flexible")} title="Flexible Amount" desc="Contributors choose how much to give."
            icon={<Icon name="layers" className="h-7 w-7" />}>
            <MoneyField id="minimum" label="Minimum Contribution" optional placeholder="e.g. 1,000" value={draft.minimum} onChange={(v) => change({ minimum: v })} error={errors.minimum} />
            <MoneyField id="target" label="Target Amount" optional placeholder="e.g. 500,000" value={draft.target} onChange={(v) => change({ target: v })} error={errors.target} />
          </TypeCard>
          <Msg error={errors.type} />
        </div>

        <section className="mt-6 space-y-5 rounded-[28px] border border-accent/30 bg-white p-5 shadow-soft" aria-label="Additional settings">
          <h3 className="text-base font-bold">Additional Settings</h3>
          <div>
            <label htmlFor="deadline" className="mb-2 block text-[13px] font-semibold">Collection Deadline <span className="font-medium text-muted">(optional)</span></label>
            <input id="deadline" type="date" min={today || undefined} value={draft.deadline} onChange={(e) => change({ deadline: e.target.value })} aria-invalid={!!errors.deadline}
              className={`${base} h-[54px] px-4 ${errors.deadline ? bad : ok}`} />
            <Msg error={errors.deadline} />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-bg p-4">
            <div className="min-w-0">
              <p id="above-l" className="text-sm font-semibold">Allow contributions above target</p>
              <p className="mt-0.5 text-xs text-muted">Keep accepting payments after the goal is reached.</p>
            </div>
            <button type="button" role="switch" aria-checked={draft.allowAboveTarget} aria-labelledby="above-l" onClick={() => update({ allowAboveTarget: !draft.allowAboveTarget })}
              className={`relative h-8 w-14 flex-none rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${draft.allowAboveTarget ? "bg-primary" : "bg-accent/60"}`}>
              <span className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${draft.allowAboveTarget ? "translate-x-6" : ""}`} />
            </button>
          </div>
        </section>
      </div>

      <FlowFooter className="grid-cols-[1fr_2fr]">
        <LinkButton href="/collections/create/details" variant="secondary">Back</LinkButton>
        <Button onClick={next} loading={busy} loadingText="Next…">Next</Button>
      </FlowFooter>
    </div>
  );
}
