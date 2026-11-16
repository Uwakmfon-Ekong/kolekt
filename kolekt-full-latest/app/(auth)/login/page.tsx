"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import Field from "@/components/Field";
import Logo from "@/components/Logo";
import { loginAction } from "@/app/actions/auth";

type Errors = { email?: string; password?: string };

const check = (email: string, pw: string): Errors => {
  const e: Errors = {};
  if (!email.trim()) e.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = "Enter a valid email address.";
  if (!pw) e.password = "Please enter your password.";
  else if (pw.length < 6) e.password = "Password must be at least 6 characters.";
  return e;
};

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kolekt_email");
      if (saved) { setEmail(saved); setRemember(true); }
    } catch { /* storage unavailable */ }
  }, []);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");
    const e = check(email, pw);
    setErrors(e);
    if (e.email) return document.getElementById("email")?.focus();
    if (e.password) return document.getElementById("password")?.focus();
    try {
      if (remember) localStorage.setItem("kolekt_email", email.trim());
      else localStorage.removeItem("kolekt_email");
    } catch { /* ignore */ }
    setBusy(true);
    try {
      const res = await loginAction({ email, password: pw, remember });
      if (!res.ok) { setFormError(res.error); setBusy(false); return; }
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <header className="mb-8 text-center">
        <div className="flex justify-center"><Logo size={76} withWord={false} /></div>
        <p className="mt-3.5 text-3xl font-extrabold tracking-tight">Kole<span className="text-primary">kt</span></p>
        <p className="mt-1.5 text-[13.5px] font-medium tracking-wide text-muted">Collect. Track. Stay Transparent.</p>
      </header>

      <section className="rounded-[28px] border border-accent/30 bg-white p-6 shadow-soft md:p-9">
        <h1 className="text-[26px] font-bold tracking-tight">Welcome back</h1>
        <p className="mb-6 mt-2 text-[14.5px] leading-relaxed text-muted">Sign in to manage your collections and track every contribution.</p>

        <form onSubmit={submit} noValidate className="space-y-4">
          <Field id="email" label="Email address" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com"
            value={email} onChange={(v) => { setEmail(v); if (errors.email) setErrors((e) => ({ ...e, email: check(v, pw).email })); }} error={errors.email} />
          <Field id="password" label="Password" type="password" autoComplete="current-password" placeholder="Enter your password"
            value={pw} onChange={(v) => { setPw(v); if (errors.password) setErrors((e) => ({ ...e, password: check(email, v).password })); }} error={errors.password} />

          <div className="flex items-center justify-between gap-3 pb-2 pt-1">
            <div className="text-[13.5px]"><Checkbox checked={remember} onChange={setRemember}>Remember me</Checkbox></div>
            <button type="button" onClick={() => setNote("Password reset by email is coming soon. For now, ask the Kolekt team to reset it for you.")} className="text-[13.5px] font-semibold text-primary hover:underline">Forgot password?</button>
          </div>

          {formError && <p role="alert" className="rounded-xl bg-[#C2344D]/8 px-3.5 py-2.5 text-[13px] font-medium text-[#C2344D]">{formError}</p>}
          <Button type="submit" loading={busy} loadingText="Signing in…">Login</Button>
        </form>

        {note && <p role="status" className="mt-3 text-center text-xs text-muted">{note}</p>}

        <p className="mt-6 text-center text-[14.5px] text-muted">Don’t have an account? <Link href="/signup" className="font-semibold text-primary hover:underline">Sign Up</Link></p>
      </section>
    </AuthShell>
  );
}
