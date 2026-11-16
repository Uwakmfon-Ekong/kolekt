"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon, { IconName } from "./Icon";
import Logo from "./Logo";
import { useApp } from "@/lib/create-collection";
import { timeAgo } from "@/lib/data";
import { logoutAction } from "@/app/actions/auth";
import { NOTICES_SEEN_KEY, readSeen, writeSeen } from "@/lib/notices-seen";

const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/collections", label: "Collections", icon: "layers" },
  { href: "/reports", label: "Reports", icon: "chart" },
  { href: "/profile", label: "Profile", icon: "user" },
];


function Bell() {
  const { activity } = useApp();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string | null>(null);
  useEffect(() => {
    setSeen(readSeen());
    const sync = (e: StorageEvent | Event) => { if (!("key" in e) || e.key === NOTICES_SEEN_KEY) setSeen(readSeen()); };
    window.addEventListener("storage", sync);
    window.addEventListener("kolekt-notices-seen", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("kolekt-notices-seen", sync); };
  }, []);
  const unreadCount = seen === null ? 0 : activity.filter((a) => a.at > seen).length;
  const unread = unreadCount > 0;
  const markRead = () => setSeen(writeSeen(activity[0]?.at));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-label={unread ? `Notifications, ${unreadCount} unread` : "Notifications"} aria-expanded={open} aria-haspopup="true"
        className="relative grid h-11 w-11 place-items-center rounded-2xl bg-card text-ink transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <Icon name="bell" className="h-5 w-5" />
        {unread && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-accent/30 bg-white p-2 shadow-soft">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-bold">Notifications</p>
            {unread && <button onClick={markRead} className="text-xs font-semibold text-primary hover:underline">Mark all read</button>}
          </div>
          {activity.length ? (
            <ul>
              {activity.map((i) => (
                <li key={i.id}>
                  <Link href={i.href ?? "/notifications"} onClick={() => setOpen(false)} className="flex gap-2.5 rounded-xl px-3 py-2.5 hover:bg-bg">
                    <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${seen !== null && i.at > seen ? "bg-primary" : "bg-transparent"}`} />
                    <span>
                      <span className="block text-[13px] font-medium leading-snug">{i.text}</span>
                      <span className="mt-0.5 block text-xs text-muted">{timeAgo(i.at)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 pb-3 pt-1 text-[13px] text-muted">No contributions yet. They’ll show up here as soon as someone pays.</p>
          )}
          <Link href="/notifications" onClick={() => setOpen(false)} className="mt-1 block rounded-xl border-t border-card px-3 py-2.5 text-center text-xs font-bold text-primary hover:bg-bg">View all notifications</Link>
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useApp();
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-accent/30 bg-bg px-5 py-7 md:flex">
        <Link href="/dashboard" className="px-2"><Logo size={40} /></Link>
        <nav className="mt-10 flex flex-col gap-1.5" aria-label="Main">
          {items.map((i) => (
            <Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition ${active(i.href) ? "bg-primary text-white shadow-cta" : "text-muted hover:bg-card hover:text-ink"}`}>
              <Icon name={i.icon} className="h-5 w-5" /> {i.label}
            </Link>
          ))}
          <Link href="/collections/create/details" className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-accent px-4 py-3 text-[15px] font-semibold text-primary transition hover:bg-card">
            <Icon name="plus" className="h-5 w-5" /> New collection
          </Link>
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-2xl bg-card p-3">
          <span className="grid h-10 w-10 flex-none place-items-center overflow-hidden rounded-full bg-accent font-bold text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {user.photo ? <img src={user.photo} alt="" className="h-full w-full object-cover" /> : (user.name[0] || "K").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <button type="button" onClick={() => logoutAction()} aria-label="Log out" title="Log out" className="grid h-9 w-9 flex-none place-items-center rounded-xl text-muted transition hover:bg-white hover:text-[#C2344D]">
            <Icon name="logout" className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b border-accent/20 bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 md:justify-end md:px-8">
            <Link href="/dashboard" className="md:hidden"><Logo /></Link>
            <Bell />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-5 pb-32 pt-6 md:px-8 md:pb-14 md:pt-8">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-accent/30 bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto grid h-[68px] max-w-md grid-cols-5 items-center px-2">
          {[items[0], items[1]].map((i) => <NavLink key={i.href} {...i} on={active(i.href)} />)}
          <li className="flex justify-center">
            <Link href="/collections/create/details" aria-label="Create a collection"
              className="-mt-8 grid h-16 w-16 place-items-center rounded-full border-4 border-bg bg-gradient-to-b from-[#8553E6] to-primary text-white shadow-cta transition active:scale-95">
              <Icon name="plus" className="h-7 w-7" width={2.5} />
            </Link>
          </li>
          {[items[2], items[3]].map((i) => <NavLink key={i.href} {...i} on={active(i.href)} />)}
        </ul>
      </nav>
    </div>
  );
}

function NavLink({ href, label, icon, on }: { href: string; label: string; icon: IconName; on: boolean }) {
  return (
    <li>
      <Link href={href} aria-current={on ? "page" : undefined} className={`flex flex-col items-center gap-1 py-1 text-[11px] font-semibold transition ${on ? "text-primary" : "text-muted"}`}>
        <Icon name={icon} className="h-[22px] w-[22px]" width={on ? 2.4 : 2} />
        {label}
      </Link>
    </li>
  );
}
