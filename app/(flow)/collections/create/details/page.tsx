"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import WalletIllustration from "@/components/WalletIllustration";
import StepHeader from "@/components/StepHeader";
import { Button } from "@/components/Button";
import FlowFooter from "@/components/FlowFooter";
import { CollectionDraft, useCreateCollection } from "@/lib/create-collection";

type Errors = Partial<Record<"name" | "description" | "organisation", string>>;

const validate = (d: CollectionDraft): Errors => {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "Please enter a collection name.";
  else if (d.name.trim().length < 3) e.name = "Name should be at least 3 characters.";
  if (!d.description.trim()) e.description = "Tell people what this collection is for.";
  else if (d.description.trim().length < 10) e.description = "Description should be at least 10 characters.";
  if (!d.organisation.trim()) e.organisation = "Please enter your organisation name.";
  return e;
};

const field = "w-full rounded-2xl border-[1.5px] bg-bg px-4 text-[15.5px] font-medium outline-none transition placeholder:text-[#B1A8B8] focus:bg-white focus:ring-4";
const ok = "border-card focus:border-primary focus:ring-primary/10";
const bad = "border-[#C2344D] focus:border-[#C2344D] focus:ring-[#C2344D]/10";

export default function DetailsPage() {
  const router = useRouter();
  const { draft, update } = useCreateCollection();
  const [errors, setErrors] = useState<Errors>({});
  const [imgError, setImgError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof Errors, v: string) => {
    update({ [k]: v });
    if (errors[k]) setErrors((e) => ({ ...e, [k]: validate({ ...draft, [k]: v })[k] }));
  };
  const blur = (k: keyof Errors) => draft[k] && setErrors((e) => ({ ...e, [k]: validate(draft)[k] }));

  const onFile = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setImgError("Please choose an image file.");
    if (f.size > 5 * 1024 * 1024) return setImgError("Image must be under 5 MB.");
    setImgError("");
    const r = new FileReader();
    r.onload = () => update({ image: String(r.result) });
    r.readAsDataURL(f);
  };

  const next = () => {
    const e = validate(draft);
    setErrors(e);
    const first = (["name", "description", "organisation"] as const).find((k) => e[k]);
    if (first) return document.getElementById(first)?.focus();
    setBusy(true);
    setTimeout(() => router.push("/collections/create/contribution-type"), 500);
  };

  return (
    <div className="relative min-h-screen overflow-hidden pb-32">
      <div className="pointer-events-none fixed -right-28 -top-32 h-80 w-80 rounded-full bg-accent/35" />
      <div className="pointer-events-none fixed -bottom-20 -left-24 h-56 w-56 rounded-full bg-card" />

      <div className="relative mx-auto max-w-xl px-5 pt-[max(env(safe-area-inset-top),12px)] md:pt-10">
        <StepHeader step={1} backHref="/dashboard" between={<div className="mt-2 flex justify-center"><WalletIllustration className="h-auto w-full max-w-[300px] drop-shadow-[0_18px_24px_rgba(119,67,219,.18)]" /></div>} />

        <div className="mt-7">
          <h2 className="text-2xl font-extrabold tracking-tight">Collection Details</h2>
          <p className="mt-1.5 text-[15px] text-muted">Give your collection a name and description.</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); next(); }} noValidate className="mt-6 space-y-5 rounded-[28px] border border-accent/30 bg-white p-5 shadow-soft md:p-7">
          <div>
            <label htmlFor="name" className="mb-2 block text-[13px] font-semibold">Collection Name</label>
            <input id="name" value={draft.name} onChange={(e) => set("name", e.target.value)} onBlur={() => blur("name")} placeholder="e.g. Church Building Fund" autoComplete="off" aria-invalid={!!errors.name}
              className={`${field} h-[54px] ${errors.name ? bad : ok}`} />
            {errors.name && <p role="alert" className="mt-1.5 px-0.5 text-xs font-medium text-[#C2344D]">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-[13px] font-semibold">Description</label>
            <textarea id="description" rows={4} maxLength={300} value={draft.description} onChange={(e) => set("description", e.target.value)} onBlur={() => blur("description")} placeholder="Tell people about your collection..." aria-invalid={!!errors.description}
              className={`${field} resize-none py-3.5 leading-relaxed ${errors.description ? bad : ok}`} />
            <div className="mt-1.5 flex justify-between gap-3 px-0.5 text-xs">
              <p role="alert" className="font-medium text-[#C2344D]">{errors.description}</p>
              <span className="flex-none text-muted">{draft.description.length}/300</span>
            </div>
          </div>

          <div>
            <label htmlFor="organisation" className="mb-2 block text-[13px] font-semibold">Organisation Name</label>
            <input id="organisation" value={draft.organisation} onChange={(e) => set("organisation", e.target.value)} onBlur={() => blur("organisation")} placeholder="e.g. Computer Science Department" autoComplete="organization" aria-invalid={!!errors.organisation}
              className={`${field} h-[54px] ${errors.organisation ? bad : ok}`} />
            {errors.organisation && <p role="alert" className="mt-1.5 px-0.5 text-xs font-medium text-[#C2344D]">{errors.organisation}</p>}
          </div>

          <div>
            <span className="mb-2 block text-[13px] font-semibold">Collection Image <span className="font-medium text-muted">(optional)</span></span>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
            {draft.image ? (
              <div className="relative overflow-hidden rounded-2xl border border-accent/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.image} alt="Collection preview" className="aspect-video w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-ink/60 to-transparent p-3">
                  <button type="button" onClick={() => fileRef.current?.click()} className="rounded-xl bg-white/90 px-3.5 py-2 text-xs font-bold text-ink backdrop-blur hover:bg-white">Change</button>
                  <button type="button" onClick={() => update({ image: null })} className="rounded-xl bg-white/90 px-3.5 py-2 text-xs font-bold text-[#C2344D] backdrop-blur hover:bg-white">Remove</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-accent bg-bg px-4 py-7 text-center transition hover:border-primary hover:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-white shadow-cta"><Icon name="camera" className="h-5 w-5" /></span>
                <span className="text-sm font-semibold">Upload an image</span>
                <span className="text-xs text-muted">PNG or JPG, up to 5 MB</span>
              </button>
            )}
            {imgError && <p role="alert" className="mt-1.5 px-0.5 text-xs font-medium text-[#C2344D]">{imgError}</p>}
          </div>
        </form>
      </div>

      <FlowFooter>
        <Button onClick={next} loading={busy} loadingText="Next…">Next</Button>
      </FlowFooter>
    </div>
  );
}
