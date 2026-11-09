"use client";

import { useState } from "react";
import { Button, LinkButton } from "@/components/Button";
import { Card, EmptyState } from "@/components/Card";
import Icon from "@/components/Icon";
import { useApp } from "@/lib/create-collection";

export default function PublishedPage() {
  const { published, reset } = useApp();
  const [copied, setCopied] = useState(false);

  if (!published) {
    return (
      <div className="mx-auto max-w-md px-5 py-16">
        <EmptyState icon="inbox" title="Nothing published yet" text="Create a collection and publish it to see it here."
          action={<LinkButton href="/collections/create/details" size="md">Create a Collection</LinkButton>} />
      </div>
    );
  }

  const link = published.url.replace("https://", "");
  const copy = async () => {
    try { await navigator.clipboard.writeText(published.url); } catch { /* unavailable */ }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative min-h-screen overflow-hidden pb-12">
      <div className="pointer-events-none fixed -right-28 -top-32 h-80 w-80 rounded-full bg-accent/35" />
      <div className="pointer-events-none fixed -bottom-20 -left-24 h-56 w-56 rounded-full bg-card" />
      <span className="fa pointer-events-none absolute left-[12%] top-24 h-3 w-3 rounded-full bg-primary/40" />
      <span className="fb pointer-events-none absolute right-[14%] top-36 h-4 w-4 rounded-full bg-accent" />
      <span className="fc pointer-events-none absolute left-[22%] top-60 h-2.5 w-2.5 rounded-full bg-primary/30" />
      <span className="fa pointer-events-none absolute right-[22%] top-20 h-2.5 w-2.5 rounded-full bg-primary/50" />

      <div className="relative mx-auto max-w-md px-5 pt-[max(env(safe-area-inset-top),48px)] text-center">
        <div className="relative mx-auto h-24 w-24">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <span className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-b from-[#9468EE] to-primary text-white shadow-cta"><Icon name="check" className="h-11 w-11" width={3} /></span>
        </div>
        <h1 className="mt-6 text-[28px] font-extrabold tracking-tight">Collection Published!</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">Your collection is live and ready to receive contributions.</p>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Active</span>

        <Card className="mt-7 p-2 text-left">
          <dl className="divide-y divide-card text-sm">
            <div className="flex items-center justify-between gap-4 px-4 py-3.5"><dt className="font-semibold text-muted">Collection</dt><dd className="truncate font-bold">{published.name}</dd></div>
            <div className="flex items-center justify-between gap-4 px-4 py-3.5"><dt className="font-semibold text-muted">Collection ID</dt><dd className="font-bold">{published.id}</dd></div>
            <div className="flex items-center justify-between gap-3 px-4 py-3"><dt className="flex-none font-semibold text-muted">Public link</dt>
              <dd className="flex min-w-0 items-center gap-2"><span className="truncate font-bold">{link}</span>
                <button onClick={copy} className="flex flex-none items-center gap-1 rounded-lg bg-card px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-accent/30"><Icon name="copy" className="h-3.5 w-3.5" />{copied ? "Copied" : "Copy"}</button>
              </dd></div>
          </dl>
        </Card>

        <div className="mt-6 space-y-3">
          <LinkButton href={`/c/${published.slug}`} onClick={reset}>View Collection</LinkButton>
          <Button variant="secondary" onClick={copy}><Icon name="share" className="h-5 w-5" /> {copied ? "Link copied" : "Share link"}</Button>
          <LinkButton href="/dashboard" variant="ghost" size="md" onClick={reset}>Back to Dashboard</LinkButton>
          <LinkButton href="/collections/create/details" variant="ghost" size="md" onClick={reset}>Create another collection</LinkButton>
        </div>
      </div>
    </div>
  );
}
