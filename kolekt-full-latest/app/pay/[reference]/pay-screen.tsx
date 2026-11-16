"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { naira } from "@/lib/data";

type Instructions = {
  amountToPay: number;
  bankTransfer?: { bankName: string; accountNumber: string };
  ussd?: { code: string; reference?: string };
  pagaLink?: string;
  expiresAt: string;
};

const until = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" });

function CopyChip({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); } catch { /* clipboard unavailable */ }
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-xl bg-card px-3 py-2 text-xs font-bold text-primary transition hover:bg-accent/30"
    >
      <Icon name={done ? "check" : "copy"} className="h-3.5 w-3.5" width={done ? 3 : 2} /> {done ? "Copied" : label}
    </button>
  );
}

export default function PayScreen(props: {
  reference: string;
  slug: string;
  payerName: string;
  amount: number;
  instructions: Instructions | null;
  initialStatus: string;
  mode: "mock" | "sandbox" | "live";
}) {
  const router = useRouter();
  const [status, setStatus] = useState(props.initialStatus);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const stopped = useRef(false);

  // Poll for the result. The webhook usually settles the payment first; if one is ever
  // lost, the status endpoint re-checks Paga directly, so nobody is stuck waiting.
  useEffect(() => {
    if (status !== "pending") return;
    const tick = async () => {
      if (stopped.current) return;
      try {
        const res = await fetch(`/api/pay/${props.reference}/status`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { status: string };
        if (data.status !== "pending") {
          stopped.current = true;
          setStatus(data.status);
          if (data.status === "successful") setTimeout(() => router.push(`/receipt/${props.reference}`), 1500);
        }
      } catch {
        /* offline blip: keep polling */
      }
    };
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [status, props.reference, router]);

  async function simulate() {
    setSimulating(true);
    setSimError(null);
    const res = await fetch("/api/dev/simulate-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: props.reference }),
    });
    if (!res.ok) {
      setSimError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "The simulated transfer failed.");
      setSimulating(false);
    }
    // On success the status poll picks up the verified payment within a few seconds.
  }

  if (status === "successful") {
    return (
      <div className="mt-6 rounded-[30px] border border-accent/35 bg-white p-8 text-center shadow-soft">
        <div className="relative mx-auto h-20 w-20">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#2E9E6B]/20 motion-reduce:hidden" />
          <span className="relative grid h-20 w-20 place-items-center rounded-full bg-[#2E9E6B] text-white"><Icon name="check" className="h-10 w-10" width={3} /></span>
        </div>
        <p className="mt-5 text-xl font-extrabold">Payment confirmed</p>
        <p className="mt-1 text-sm text-muted">Verified with Paga. Opening your receipt…</p>
      </div>
    );
  }

  if (status !== "pending") {
    return (
      <div className="mt-6 rounded-[30px] border border-accent/35 bg-white p-8 text-center shadow-soft">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-card text-primary"><Icon name="clock" className="h-7 w-7" /></span>
        <p className="mt-4 text-lg font-extrabold">{status === "expired" ? "This account number has expired" : "This payment didn’t go through"}</p>
        <p className="mt-1 text-sm text-muted">No money was taken for this request. Start again to get a fresh account number.</p>
        <Link href={`/c/${props.slug}`} className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-bold text-white shadow-cta">Start again</Link>
      </div>
    );
  }

  const bt = props.instructions?.bankTransfer;
  const i = props.instructions;
  return (
    <div className="mt-6 space-y-4">
      <section className="overflow-hidden rounded-[30px] border border-accent/35 bg-white shadow-soft">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary to-[#9468EE] px-6 py-6 text-white">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <p className="relative text-sm font-medium text-white/80">Transfer exactly</p>
          <p className="relative mt-1 text-[40px] font-extrabold leading-none tracking-tight">{naira(props.amount)}</p>
          <p className="relative mt-2 text-sm text-white/80">from any bank app to the account below</p>
        </div>
        {bt ? (
          <div className="space-y-4 p-6">
            <div className="rounded-2xl bg-bg p-4">
              <p className="text-xs font-semibold text-muted">Account number</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="whitespace-nowrap text-[clamp(22px,7vw,28px)] font-extrabold tracking-[.06em]">{bt.accountNumber.replace(/(\d{3})(\d{3})(\d+)/, "$1 $2 $3")}</p>
                <CopyChip text={bt.accountNumber} label="Copy" />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-card p-3.5"><dt className="text-xs font-semibold text-muted">Bank</dt><dd className="mt-1 font-bold">{bt.bankName}</dd></div>
              <div className="rounded-2xl border border-card p-3.5"><dt className="text-xs font-semibold text-muted">Paying as</dt><dd className="mt-1 truncate font-bold">{props.payerName}</dd></div>
            </dl>
            <p className="flex gap-2 rounded-2xl bg-card/70 p-3.5 text-xs leading-relaxed text-ink/80">
              <Icon name="shield" className="h-4 w-4 flex-none text-primary" />
              <span>
                This account number is only for your payment{i?.expiresAt ? ` and works until ${until(i.expiresAt)}` : ""}. Send the exact amount in one transfer and we’ll match it to you automatically. No screenshot needed.
              </span>
            </p>
          </div>
        ) : (
          <p className="p-6 text-sm text-muted">Payment details aren’t available. <Link className="font-semibold text-primary underline" href={`/c/${props.slug}`}>Start again</Link>.</p>
        )}
      </section>

      {(i?.ussd?.code || i?.pagaLink) && (
        <details className="group rounded-3xl border border-accent/30 bg-white px-5 py-4 text-sm shadow-soft">
          <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
            No data or bank app? Other ways to pay
            <Icon name="chevron" className="h-4 w-4 text-muted transition group-open:rotate-90" />
          </summary>
          <div className="mt-3 space-y-3">
            {i?.ussd?.code && (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-bg p-3">
                <span className="flex items-center gap-2"><Icon name="smartphone" className="h-4 w-4 text-primary" /> Dial <b className="font-mono">{i.ussd.code}</b></span>
                <a href={`tel:${encodeURIComponent(i.ussd.code)}`} className="font-bold text-primary hover:underline">Dial</a>
              </div>
            )}
            {i?.pagaLink && (
              <a href={i.pagaLink} className="flex items-center justify-between rounded-2xl bg-bg p-3 font-bold text-primary hover:underline">
                Pay with your Paga wallet <Icon name="chevron" className="h-4 w-4" />
              </a>
            )}
          </div>
        </details>
      )}

      <div className="flex items-center justify-center gap-2.5 py-2 text-sm font-medium text-muted" aria-live="polite">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 motion-reduce:hidden" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        Waiting for your transfer. This page updates by itself.
      </div>

      {props.mode === "mock" && (
        <div className="rounded-3xl border border-dashed border-accent bg-card/60 p-5 text-sm">
          <p className="font-bold">Demo mode</p>
          <p className="mt-1 leading-relaxed text-muted">
            No real money moves. Simulate the bank transfer: Kolekt receives a signed Paga notification and verifies it, exactly as it would with a real payment.
          </p>
          {simError && <p className="mt-2 font-medium text-[#C2344D]">{simError}</p>}
          <button
            type="button"
            onClick={simulate}
            disabled={simulating}
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-2xl border-[1.5px] border-accent/50 bg-white px-4 font-bold transition hover:border-primary disabled:opacity-70"
          >
            {simulating ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" /> Transfer sent…</> : "Simulate bank transfer"}
          </button>
        </div>
      )}
      {props.mode === "sandbox" && (
        <p className="text-center text-xs text-muted">
          Paga sandbox: pay this account with the{" "}
          <a className="font-semibold text-primary underline" href="https://qa-developer-portal.paga.com/simulate/inbound-bank-deposit" target="_blank" rel="noopener noreferrer">
            Bank Transfer Simulator
          </a>
          .
        </p>
      )}
      <p className="text-center text-xs text-muted">Reference {props.reference}</p>
    </div>
  );
}
