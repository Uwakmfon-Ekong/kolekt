import type { ReactNode } from "react";
import { BatteryFull, Bell, Check, Copy, Signal, Wifi } from "lucide-react";
import { PHONE_DEMO } from "../content";
import { Avatar, VerifiedBadge } from "../ui/badges";
import { CountUp } from "../ui/count-up";
import { LogoMark, Wordmark } from "../ui/logo";

/** The phone in the hero: a live collection screen. */
export function PhoneMockup() {
  const d = PHONE_DEMO;
  return (
    <div className="relative mx-auto w-[300px] rounded-[50px] bg-[#0B0613] p-[10px] shadow-[0_40px_100px_-30px_rgba(119,67,219,0.55)] sm:w-[320px]">
      {/* Side buttons */}
      <span className="absolute -left-[3px] top-28 h-14 w-[3px] rounded-l bg-[#2A2138]" aria-hidden />
      <span className="absolute -right-[3px] top-36 h-20 w-[3px] rounded-r bg-[#2A2138]" aria-hidden />

      <div className="relative overflow-hidden rounded-[41px] bg-[#FFFBF5]">
        <StatusBar />
        <PaymentToast />

        <div className="px-5 pb-8 pt-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <LogoMark className="h-7 w-7" />
              <Wordmark className="text-[15px]" />
            </span>
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#F7EFE5] text-[#1A1028]">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#7743DB] ring-2 ring-[#F7EFE5]" />
            </span>
          </div>

          {/* Balance card */}
          <div className="relative mt-5 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#8A58E6] to-[#6633C9] p-5 text-white">
            <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full border-[18px] border-white/10" aria-hidden />
            <p className="text-[12px] font-medium text-white/75">{d.collection}</p>
            <CountUp value={d.collectedValue} prefix="₦" className="mt-1 block text-[32px] font-extrabold leading-none tracking-[-0.03em]" />
            <p className="mt-1.5 text-[12px] text-white/75">of {d.target} target</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="kolekt-fill h-full rounded-full bg-white" style={{ width: `${d.progress}%` }} />
            </div>
            <div className="mt-2.5 flex justify-between text-[12px] font-medium">
              <span>{d.paid}</span>
              <span>{d.progress}%</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <PhoneButton icon={<Copy className="h-4 w-4" />} label="Share link" />
            <PhoneButton icon={<Bell className="h-4 w-4" />} label="Remind" />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-[14px] font-bold text-[#1A1028]">Just paid</p>
            <p className="text-[12px] font-semibold text-[#7743DB]">See all</p>
          </div>
          <ul className="mt-2.5 space-y-2">
            {d.recent.map((r) => (
              <li key={r.name} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-[#F0E6D8]">
                <Avatar initials={r.initials} color="rgba(195,172,208,0.45)" className="text-[#4A2A8A]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-[#1A1028]">{r.name}</span>
                  <span className="block text-[11px] text-[#6B6178]">{r.time}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[13px] font-bold text-[#1A1028]">{r.amount}</span>
                  <VerifiedBadge size="sm" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** "Payment received" banner that drops in from the top every few seconds. */
function PaymentToast() {
  const latest = PHONE_DEMO.recent[0];
  return (
    <div className="k-toast absolute inset-x-3 top-11 z-20 flex items-center gap-2.5 rounded-2xl bg-white/95 p-2.5 shadow-[0_12px_30px_-12px_rgba(26,16,40,0.45)] ring-1 ring-[#EFE4D4] backdrop-blur">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7743DB] text-white">
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
      <span className="min-w-0 text-[12px] leading-tight">
        <span className="block font-bold text-[#1A1028]">
          {latest.amount} from {latest.name}
        </span>
        <span className="block text-[#6B6178]">Payment verified · now</span>
      </span>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="relative flex items-center justify-between px-7 pb-1 pt-4 text-[13px] font-semibold text-[#1A1028]">
      <span>9:41</span>
      <span className="absolute left-1/2 top-3 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-[#0B0613]" />
      <span className="flex items-center gap-1">
        <Signal className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <BatteryFull className="h-4 w-4" />
      </span>
    </div>
  );
}

function PhoneButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#1A1028] text-[13px] font-semibold text-white">
      {icon} {label}
    </span>
  );
}
