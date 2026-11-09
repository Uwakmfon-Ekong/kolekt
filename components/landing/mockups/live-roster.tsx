import { ROSTER_DEMO } from "../content";
import { PaidStatus } from "../ui/badges";
import { CountUp } from "../ui/count-up";
import { stagger } from "../ui/motion";

/** Live "who has paid" list with a floating progress chip. */
export function LiveRoster() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_-14px_rgba(26,16,40,0.35)]">
        <div className="flex items-center justify-between border-b border-[#F3EADF] px-5 py-3.5">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#1A1028]">
            <LiveDot /> 300L Dues · live
          </span>
          <span className="text-[12px] text-[#6B6178]">₦3,000 each</span>
        </div>

        <ul className="k-stagger">
          {ROSTER_DEMO.map((p, i) => (
            <li key={p.id} style={stagger(i)} className="flex items-center justify-between gap-3 border-b border-[#F7F1E8] px-5 py-3 last:border-0">
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-[#1A1028]">{p.name}</span>
                <span className="block text-[11px] text-[#6B6178]">{p.id}</span>
              </span>
              <PaidStatus paid={p.paid} />
            </li>
          ))}
        </ul>

        <div className="flex justify-end border-t border-[#F3EADF] bg-[#FFFBF5] px-5 py-4 text-[13px]">
          <span className="text-[#6B6178]">
            <span className="hidden sm:inline">Collected </span>
            <span className="font-extrabold text-[#1A1028]">₦204,000</span>
          </span>
        </div>
      </div>

      <ProgressChip paid={68} total={100} />
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="kolekt-ping absolute inline-flex h-full w-full rounded-full bg-[#7743DB]" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7743DB]" />
    </span>
  );
}

function ProgressChip({ paid, total }: { paid: number; total: number }) {
  const circumference = 2 * Math.PI * 15;
  const offset = circumference * (1 - paid / total);
  return (
    <div className="absolute -bottom-7 -left-3 flex items-center gap-3 rounded-2xl bg-[#1A1028] px-4 py-3 text-white shadow-[0_18px_40px_-16px_rgba(26,16,40,0.7)] sm:-left-10">
      <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r="15" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="4" />
        <circle
          className="k-ring"
          style={{ ["--k-circ" as string]: circumference }}
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="#C3ACD0"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span>
        <span className="block text-[18px] font-extrabold leading-tight">
          <CountUp value={paid} duration={1400} /> / {total}
        </span>
        <span className="block text-[11px] text-white/60">paid · {total - paid} to go</span>
      </span>
    </div>
  );
}
