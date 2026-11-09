"use client";

import { Card, EmptyState } from "@/components/Card";
import { LinkButton } from "@/components/Button";
import { useApp } from "@/lib/create-collection";
import { naira, percent } from "@/lib/data";

export default function ReportsPage() {
  const { collections } = useApp();
  const total = collections.reduce((s, c) => s + c.collected, 0);
  const targets = collections.reduce((s, c) => s + c.target, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight md:text-3xl">Reports</h1>
        <p className="mt-1.5 text-[15px] text-muted">See how every collection is performing.</p>
      </div>

      {collections.length ? (
        <>
          <div className="grid grid-cols-2 gap-3.5 md:gap-5">
            <Card tone="tinted" className="p-5"><p className="text-xs font-semibold text-muted">Total collected</p><p className="mt-1 text-2xl font-extrabold tracking-tight">{naira(total)}</p></Card>
            <Card tone="tinted" className="p-5"><p className="text-xs font-semibold text-muted">Combined targets</p><p className="mt-1 text-2xl font-extrabold tracking-tight">{naira(targets)}</p></Card>
          </div>
          <Card className="p-5 md:p-7">
            <h2 className="mb-4 text-base font-bold">Progress by collection</h2>
            <ul className="space-y-5">
              {collections.map((c) => (
                <li key={c.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate font-semibold">{c.name}</span><span className="flex-none font-bold text-primary">{c.target ? `${percent(c)}%` : "—"}</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-accent/40"><div className="h-full rounded-full bg-gradient-to-r from-[#9468EE] to-primary transition-[width] duration-700" style={{ width: `${Math.min(percent(c), 100)}%` }} /></div>
                  <p className="mt-1 text-xs text-muted">{naira(c.collected)} · {c.status}</p>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : (
        <EmptyState icon="chart" title="No reports yet" text="Reports appear once you create a collection." action={<LinkButton href="/collections/create/details" size="md">Create a Collection</LinkButton>} />
      )}
    </div>
  );
}
