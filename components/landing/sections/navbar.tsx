import Link from "next/link";
import { NAV_LINKS, ROUTES } from "../content";
import { Logo } from "../ui/logo";
import { PillLink } from "../ui/pill-link";

/** Sticky top bar: stays pinned while you scroll. */
export function Navbar() {
  return (
    <div className="sticky top-0 z-50 border-b border-[#EFE4D4]/70 bg-[#FFFBF5]/80 backdrop-blur-md">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" aria-label="Kolekt home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full bg-white/70 p-1 text-[14px] font-medium text-[#6B6178] ring-1 ring-[#EFE4D4] md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 transition-colors hover:bg-[#F7EFE5] hover:text-[#1A1028]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.login}
            className="hidden px-3 text-[14px] font-semibold text-[#1A1028] hover:text-[#7743DB] sm:inline"
          >
            Sign in
          </Link>
          <PillLink href={ROUTES.start} size="sm">
            Get started
          </PillLink>
        </div>
      </header>
    </div>
  );
}
