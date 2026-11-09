"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import Field from "@/components/Field";
import Logo from "@/components/Logo";
import { useApp } from "@/lib/create-collection";

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
  const router = useRouter();
  const { user, setUser } = useApp();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [gBusy, setGBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kolekt_email");
      if (saved) { setEmail(saved); setRemember(true); }
    } catch { /* storage unavailable */ }
  }, []);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = check(email, pw);
    setErrors(e);
    if (e.email) return document.getElementById("email")?.focus();
    if (e.password) return document.getElementById("password")?.focus();
    try {
      if (remember) localStorage.setItem("kolekt_email", email.trim());
      else localStorage.removeItem("kolekt_email");
    } catch { /* ignore */ }
    setBusy(true);
    setTimeout(() => { setUser({ ...user, email: email.trim() }); router.push("/dashboard"); }, 1200);
  };

  const google = () => {
    setGBusy(true); setNote("");
    setTimeout(() => { setGBusy(false); setNote("Google sign-in is a visual demo in this prototype."); }, 1100);
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
            <button type="button" onClick={() => setNote("Password reset isn’t part of this prototype.")} className="text-[13.5px] font-semibold text-primary hover:underline">Forgot password?</button>
          </div>

          <Button type="submit" loading={busy} loadingText="Signing in…">Login</Button>
        </form>

        <div className="my-5 flex items-center gap-3.5 text-[13px] font-medium text-muted"><span className="h-px flex-1 bg-card" />or<span className="h-px flex-1 bg-card" /></div>

        <Button type="button" variant="secondary" onClick={google} loading={gBusy} disabled={busy}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.3z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.54-2.75c-.98.66-2.24 1.05-3.74 1.05-2.87 0-5.3-1.94-6.17-4.55H2.17v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.83 14.08a6.6 6.6 0 0 1 0-4.16V7.08H2.17a11 11 0 0 0 0 9.84l3.66-2.84z"/><path fill="#EA4335" d="M12 5.37c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.17 7.08l3.66 2.84C6.7 7.31 9.13 5.37 12 5.37z"/></svg>
          Continue with Google
        </Button>
        {note && <p role="status" className="mt-3 text-center text-xs text-muted">{note}</p>}

        <p className="mt-6 text-center text-[14.5px] text-muted">Don’t have an account? <Link href="/signup" className="font-semibold text-primary hover:underline">Sign Up</Link></p>
      </section>
    </AuthShell>
  );
}
