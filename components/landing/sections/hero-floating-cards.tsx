import { ArrowUpRight, BadgeCheck, TrendingUp } from "lucide-react";
import { Avatar } from "../ui/badges";
import { delay } from "../ui/motion";

const card =
  "rounded-3xl bg-white p-5 text-[#1A1028] ring-1 ring-[#EFE4D4] shadow-[0_24px_50px_-24px_rgba(119,67,219,0.45)]";

/** Tilted stat cards around the hero phone (desktop only, decorative). */
export function HeroFloatingCards() {
  return (
    <div className="pointer-events-none absolute inset-0 mx-auto hidden max-w-6xl lg:block" aria-hidden>
      <span style={delay(1000)} className="k-float-slow absolute left-[9%] top-[2%] inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1A1028] shadow-[0_10px_24px_-14px_rgba(119,67,219,0.6)] ring-1 ring-[#EFE4D4]">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7743DB] text-white">
          <TrendingUp className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
        +18.4% this week
      </span>

      <div style={delay(850)} className={`k-float absolute left-[7%] top-[13%] w-[230px] -rotate-6 ${card}`}>
        <p className="text-[12px] text-[#6B6178]">Total collected</p>
        <p className="mt-1 text-[30px] font-extrabold tracking-[-0.03em]">₦1.28M</p>
        <svg viewBox="0 0 120 32" className="mt-2 h-8 w-full" fill="none">
          <path d="M2 28 C 18 26, 22 18, 36 20 S 58 8, 72 14 S 96 4, 118 3" stroke="#7743DB" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="mt-1 text-[11px] text-[#6B6178]">across 4 active collections</p>
      </div>

      <div style={delay(950)} className={`k-float-slow absolute right-[7%] top-[3%] w-[240px] rotate-[5deg] ${card}`}>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7743DB] text-white">
            <BadgeCheck className="h-4 w-4" />
          </span>
          <p className="text-[13px] font-semibold">Payment verified</p>
        </div>
        <p className="mt-3 text-[26px] font-extrabold tracking-[-0.03em]">₦5,000</p>
        <p className="text-[12px] text-[#6B6178]">from Ada · Church Building Fund</p>
      </div>

      <div style={delay(1100)} className="k-float absolute right-[12%] top-[38%] flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-[0_14px_30px_-14px_rgba(119,67,219,0.6)] ring-1 ring-[#EFE4D4]">
        <span className="flex -space-x-2">
          {[
            ["IE", "#C3ACD0"],
            ["MU", "#F7EFE5"],
            ["AO", "#D9C8E4"],
          ].map(([initials, color]) => (
            <Avatar key={initials} initials={initials} color={color} className="h-8 w-8 text-[10px] ring-2 ring-white" />
          ))}
        </span>
        <span className="text-[13px] font-bold text-[#1A1028]">71 paid</span>
      </div>

      <span style={delay(1250)} className="k-float-slow absolute right-[10%] top-[52%] flex h-11 w-11 items-center justify-center rounded-full bg-[#7743DB] text-white shadow-[0_10px_30px_-6px_rgba(119,67,219,0.8)]">
        <ArrowUpRight className="h-5 w-5" />
      </span>
    </div>
  );
}
