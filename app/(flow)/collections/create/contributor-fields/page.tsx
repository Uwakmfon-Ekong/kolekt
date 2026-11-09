"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, LinkButton } from "@/components/Button";
import Field from "@/components/Field";
import FlowFooter from "@/components/FlowFooter";
import Icon from "@/components/Icon";
import StepHeader from "@/components/StepHeader";
import { useApp } from "@/lib/create-collection";

const presets = ["Full Name", "Email Address", "Phone Number", "Matriculation Number", "Department", "Level"];
const LOCKED = "Full Name";
const MAX_CUSTOM = 5;

export default function ContributorFieldsPage() {
  const router = useRouter();
  const { draft, update } = useApp();
  const fields = draft.contributorFields.includes(LOCKED) ? draft.contributorFields : [LOCKED, ...draft.contributorFields];
  const custom = fields.filter((f) => !presets.includes(f));
  const [label, setLabel] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const compose = (selected: Set<string>, extra: string[]) => [...presets.filter((p) => selected.has(p)), ...extra];
  const toggle = (p: string) => {
    if (p === LOCKED) return;
    const s = new Set(fields);
    s.has(p) ? s.delete(p) : s.add(p);
    update({ contributorFields: compose(s, custom) });
  };
  const add = () => {
    const v = label.trim().replace(/\s+/g, " ");
    if (v.length < 2) return setErr("Enter a field name (at least 2 characters).");
    if (v.length > 30) return setErr("Keep it under 30 characters.");
    if (fields.some((f) => f.toLowerCase() === v.toLowerCase())) return setErr("That field is already included.");
    if (custom.length >= MAX_CUSTOM) return setErr(`You can add up to ${MAX_CUSTOM} custom fields.`);
    setErr(""); setLabel("");
    update({ contributorFields: [...fields, v] });
  };
  const remove = (f: string) => update({ contributorFields: fields.filter((x) => x !== f) });
  const next = () => {
    update({ contributorFields: fields });
    setBusy(true);
    setTimeout(() => router.push("/collections/create/preview"), 500);
  };

  return (
    <div className="relative min-h-screen overflow-hidden pb-40">
      <div className="pointer-events-none fixed -right-28 -top-32 h-80 w-80 rounded-full bg-accent/35" />
      <div className="pointer-events-none fixed -bottom-20 -left-24 h-56 w-56 rounded-full bg-card" />

      <div className="relative mx-auto max-w-xl px-5 pt-[max(env(safe-area-inset-top),12px)] md:pt-10">
        <StepHeader step={3} backHref="/collections/create/contribution-type" />

        <div className="mt-7">
          <h2 className="text-2xl font-extrabold tracking-tight">Contributor Fields</h2>
          <p className="mt-1.5 text-[15px] text-muted">Choose what contributors must provide when they give.</p>
        </div>

        <ul className="mt-6 space-y-2.5" role="group" aria-label="Contributor information">
          {presets.map((p) => {
            const on = fields.includes(p);
            const locked = p === LOCKED;
            return (
              <li key={p}>
                <button type="button" role="checkbox" aria-checked={on} aria-disabled={locked} onClick={() => toggle(p)}
                  className={`flex w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${on ? "border-primary bg-white shadow-soft" : "border-card bg-card/60 hover:border-accent"} ${locked ? "cursor-default" : ""}`}>
                  <span className="flex-1 text-[15px] font-semibold">{p}</span>
                  {locked && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">Required</span>}
                  <span className={`grid h-6 w-6 flex-none place-items-center rounded-full border-2 transition ${on ? "border-primary bg-primary text-white" : "border-accent bg-white"}`}>{on && <Icon name="check" className="h-3.5 w-3.5" width={3.4} />}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <section className="mt-6 rounded-[28px] border border-accent/30 bg-white p-5 shadow-soft" aria-label="Custom fields">
          <h3 className="text-base font-bold">Add a custom field</h3>
          <p className="mt-1 text-xs text-muted">e.g. Church Branch, Hostel, Team Name</p>
          <form className="mt-4 flex items-start gap-2.5" onSubmit={(e) => { e.preventDefault(); add(); }} noValidate>
            <Field id="custom" label="Field name" className="min-w-0 flex-1" value={label} onChange={(v) => { setLabel(v); if (err) setErr(""); }} placeholder="Enter field name" error={err} />
            <Button type="submit" size="md" full={false} className="mt-[29px] flex-none px-4" aria-label="Add field"><Icon name="plus" className="h-5 w-5" width={2.6} /></Button>
          </form>
          {custom.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {custom.map((f) => (
                <li key={f} className="flex items-center gap-1.5 rounded-full bg-card py-1.5 pl-3.5 pr-1.5 text-sm font-semibold">
                  {f}
                  <button type="button" onClick={() => remove(f)} aria-label={`Remove ${f}`} className="grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-white hover:text-[#C2344D]"><Icon name="x" className="h-3.5 w-3.5" width={2.6} /></button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <FlowFooter className="grid-cols-[1fr_2fr]">
        <LinkButton href="/collections/create/contribution-type" variant="secondary">Back</LinkButton>
        <Button onClick={next} loading={busy} loadingText="Next…">Next</Button>
      </FlowFooter>
    </div>
  );
}
