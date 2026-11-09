"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import Field from "@/components/Field";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import { useApp } from "@/lib/create-collection";

type Form = { name: string; email: string; phone: string; pw: string; cpw: string; terms: boolean };
type Errors = Partial<Record<keyof Form, string>>;

const validate = (f: Form): Errors => {
  const e: Errors = {};
  const digits = f.phone.replace(/\D/g, "");
  if (!f.name.trim()) e.name = "Please enter your full name."; else if (f.name.trim().length < 2) e.name = "Name looks too short.";
  if (!f.email.trim()) e.email = "Please enter your email address."; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Enter a valid email address.";
  if (!f.phone.trim()) e.phone = "Please enter your phone number."; else if (!/^[+\d\s()-]+$/.test(f.phone) || digits.length < 7 || digits.length > 15) e.phone = "Enter a valid phone number.";
  if (!f.pw) e.pw = "Please create a password."; else if (f.pw.length < 8 || !/\d/.test(f.pw)) e.pw = "Password doesn’t meet the requirements yet.";
  if (!f.cpw) e.cpw = "Please confirm your password."; else if (f.cpw !== f.pw) e.cpw = "Passwords don’t match.";
  if (!f.terms) e.terms = "Please accept the terms to continue.";
  return e;
};

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useApp();
  const [f, setF] = useState<Form>({ name: "", email: "", phone: "", pw: "", cpw: "", terms: false });
  const [errors, setErrors] = useState<Errors>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    const next = { ...f, [k]: v };
    setF(next);
    if (Object.keys(errors).length) setErrors(validate(next));
  };

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setPhotoErr("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return setPhotoErr("Image must be under 5 MB.");
    setPhotoErr("");
    const r = new FileReader();
    r.onload = () => setPhoto(String(r.result));
    r.readAsDataURL(file);
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(f);
    setErrors(e);
    const first = (["name", "email", "phone", "pw", "cpw"] as const).find((k) => e[k]);
    if (first) return document.getElementById(first)?.focus();
    if (e.terms) return;
    setBusy(true);
    setTimeout(() => {
      setUser({ name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), photo });
      router.push("/dashboard");
    }, 1400);
  };

  const hasLen = f.pw.length >= 8;
  const hasNum = /\d/.test(f.pw);
  const Req = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <li className={`flex items-center gap-2 text-xs font-medium transition-colors ${ok ? "text-[#23885A]" : "text-muted"}`}>
      <span className={`grid h-[18px] w-[18px] place-items-center rounded-full border-[1.5px] transition ${ok ? "border-[#2E9E6B] bg-[#2E9E6B] text-white" : "border-accent"}`}>
        {ok && <Icon name="check" className="h-2.5 w-2.5" width={4} />}
      </span>
      {children}
    </li>
  );

  return (
    <AuthShell width="max-w-[460px]">
      <div className="mb-3 flex items-center justify-between">
        <Link href="/login" aria-label="Back to login" className="grid h-11 w-11 place-items-center rounded-2xl border border-accent/40 bg-white text-ink shadow-sm transition hover:text-primary active:scale-95"><Icon name="back" /></Link>
        <Logo size={36} />
        <span className="w-11" />
      </div>

      <div className="mb-6 mt-4 text-center">
        <h1 className="text-[27px] font-bold tracking-tight">Create your account</h1>
        <p className="mt-2 text-[14.5px] text-muted">Join Kolekt and start collecting effortlessly.</p>
      </div>

      <section className="rounded-[28px] border border-accent/30 bg-white p-5 shadow-soft md:p-8">
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="mb-2 text-center">
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="Upload profile photo" className="relative mx-auto block h-[104px] w-[104px] rounded-full focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-primary/40">
              <span className={`grid h-full w-full place-items-center overflow-hidden rounded-full border-2 bg-bg transition ${photo ? "border-white ring-[3px] ring-accent" : "border-dashed border-accent hover:border-primary hover:bg-card"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photo ? <img src={photo} alt="Profile preview" className="h-full w-full object-cover" /> : <Icon name="user" className="h-10 w-10 text-accent" />}
              </span>
              <span className="absolute bottom-0.5 right-[-2px] grid h-9 w-9 place-items-center rounded-full border-[3px] border-white bg-primary text-white shadow-cta"><Icon name="camera" className="h-4 w-4" /></span>
            </button>
            <p className="mt-3 text-[13px] font-medium text-muted">Upload profile photo (optional)</p>
            {photo && <button type="button" onClick={() => setPhoto(null)} className="mt-1 px-2 py-1 text-xs font-semibold text-primary hover:underline">Remove photo</button>}
            {photoErr && <p role="alert" className="mt-1 text-xs font-medium text-[#C2344D]">{photoErr}</p>}
          </div>

          <Field id="name" label="Full name" placeholder="Your full name" autoComplete="name" value={f.name} onChange={(v) => set("name", v)} error={errors.name} />
          <Field id="email" label="Email address" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={f.email} onChange={(v) => set("email", v)} error={errors.email} />
          <Field id="phone" label="Phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="+234 801 234 5678" value={f.phone} onChange={(v) => set("phone", v)} error={errors.phone} />
          <div>
            <Field id="pw" label="Password" type="password" autoComplete="new-password" placeholder="Create a password" value={f.pw} onChange={(v) => set("pw", v)} error={errors.pw} />
            <ul className="mt-2.5 space-y-1.5 px-0.5"><Req ok={hasLen}>Minimum 8 characters</Req><Req ok={hasNum}>At least one number</Req></ul>
          </div>
          <Field id="cpw" label="Confirm password" type="password" autoComplete="new-password" placeholder="Re-enter your password" value={f.cpw} onChange={(v) => set("cpw", v)} error={errors.cpw} />

          <div className="pb-2 pt-1">
            <Checkbox checked={f.terms} onChange={(v) => set("terms", v)} error={errors.terms}>
              I agree to the <span className="font-semibold text-primary">Terms of Service</span> and <span className="font-semibold text-primary">Privacy Policy</span>
            </Checkbox>
          </div>

          <Button type="submit" loading={busy} loadingText="Creating account…">Create Account</Button>
        </form>
        <p className="mt-5 text-center text-[14.5px] text-muted">Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline">Login</Link></p>
      </section>
    </AuthShell>
  );
}
