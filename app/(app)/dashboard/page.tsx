"use client";

import Icon from "@/components/Icon";
import Link from "next/link";
import { Card, EmptyState } from "@/components/Card";
import CollectionCard from "@/components/CollectionCard";
import { LinkButton } from "@/components/Button";
import { useApp } from "@/lib/create-collection";
import { naira, stats } from "@/lib/data";

export default function DashboardPage() {
  const { collections, user, closeCollection } = useApp();
  const first = user.name.trim().split(/\s+/)[0] || "there";
  const active = collections.filter((c) => c.status === "Active").length;

  return (
    <div className="space-y-7">
      <section>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight md:text-3xl">Good morning, {first} 👋</h1>
        <p className="mt-1.5 text-[15px] text-muted">Here’s your contribution overview.</p>
      </section>

      <section className="grid grid-cols-2 gap-3.5 md:gap-5" aria-label="Summary">
        <Card tone="tinted" className="relative overflow-hidden p-4 md:p-6">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/30" />
          <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-white text-primary shadow-sm"><Icon name="wallet" /></span>
          <p className="relative mt-4 text-[13px] font-semibold text-muted">Total Collected</p>
          <p className="relative mt-1 text-[22px] font-extrabold tracking-tight md:text-3xl">{naira(stats.totalCollected)}</p>
          <p className="relative mt-2 inline-flex items-center gap-1 rounded-full bg-[#2E9E6B]/12 px-2 py-0.5 text-xs font-bold text-[#23885A]">
            <Icon name="trend" className="h-3.5 w-3.5" width={2.5} /> +{stats.growth}%
          </p>
        </Card>
        <Card tone="tinted" className="relative overflow-hidden p-4 md:p-6">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/30" />
          <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-white text-primary shadow-sm"><Icon name="layers" /></span>
          <p className="relative mt-4 text-[13px] font-semibold text-muted">Active Collections</p>
          <p className="relative mt-1 text-[22px] font-extrabold tracking-tight md:text-3xl">{active}</p>
          <p className="relative mt-2 text-xs font-medium text-muted">{active} active collection{active === 1 ? "" : "s"}</p>
        </Card>
      </section>

      <LinkButton href="/collections/create/details" full={false} className="w-full md:w-auto md:px-8">
        <Icon name="plus" className="h-5 w-5" width={2.6} /> Create a Collection
      </LinkButton>

      <section aria-labelledby="yc">
        <div className="mb-3.5 flex items-center justify-between">
          <h2 id="yc" className="text-lg font-bold tracking-tight">Your Collections</h2>
          <Link href="/collections" className="inline-flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline">
            See all <Icon name="chevron" className="h-4 w-4" />
          </Link>
        </div>
        {collections.length ? (
          <div className="grid gap-3.5 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {collections.slice(0, 3).map((c) => <CollectionCard key={c.id} c={c} onClose={() => closeCollection(c.id)} />)}
          </div>
        ) : (
          <EmptyState icon="layers" title="No collections yet" text="Create your first collection to start tracking contributions."
            action={<LinkButton href="/collections/create/details" size="md">Create a Collection</LinkButton>} />
        )}
      </section>
    </div>
  );
}
