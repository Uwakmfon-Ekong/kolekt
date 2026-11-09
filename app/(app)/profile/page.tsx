"use client";

import Link from "next/link";
import { Card } from "@/components/Card";
import { Button, LinkButton } from "@/components/Button";
import Icon, { IconName } from "@/components/Icon";
import { useApp } from "@/lib/create-collection";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, collections } = useApp();
  const [busy, setBusy] = useState(false);
  const rows: { href: string; icon: IconName; label: string }[] = [
    { href: "/collections", icon: "layers", label: `My collections (${collections.length})` },
    { href: "/reports", icon: "chart", label: "Reports" },
    { href: "/collections/create/details", icon: "plus", label: "Create a collection" },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-[26px] font-extrabold tracking-tight md:text-3xl">Profile</h1>
      <Card className="flex items-center gap-4 p-5">
        <span className="grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-full bg-accent text-2xl font-bold text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {user.photo ? <img src={user.photo} alt="" className="h-full w-full object-cover" /> : user.name[0]}
        </span>
        <div className="min-w-0"><p className="truncate text-lg font-bold">{user.name}</p><p className="truncate text-sm text-muted">{user.email}</p>{user.phone && <p className="truncate text-sm text-muted">{user.phone}</p>}</div>
      </Card>
      <Card className="divide-y divide-card">
        {rows.map((r) => (
          <Link key={r.href} href={r.href} className="flex items-center gap-3 px-5 py-4 text-[15px] font-semibold transition hover:bg-bg first:rounded-t-[28px] last:rounded-b-[28px]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-primary"><Icon name={r.icon} className="h-[18px] w-[18px]" /></span>
            <span className="flex-1">{r.label}</span><Icon name="chevron" className="h-4 w-4 text-muted" />
          </Link>
        ))}
      </Card>
      <Button variant="secondary" loading={busy} loadingText="Logging out…" onClick={() => { setBusy(true); setTimeout(() => router.push("/login"), 700); }}>
        <Icon name="logout" className="h-5 w-5" /> Log out
      </Button>
      <LinkButton href="/dashboard" variant="ghost" size="md">Back to dashboard</LinkButton>
    </div>
  );
}
