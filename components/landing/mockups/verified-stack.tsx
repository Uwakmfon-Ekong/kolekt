import { Check, X } from "lucide-react";
import { stagger } from "../ui/motion";

const notifications = [
  { who: "Ini Etim", when: "just now", faded: false },
  { who: "Mfon Udo", when: "2 min ago", faded: true },
];

/** Stack of "payment confirmed" notifications, plus the screenshot nobody needs. */
export function VerifiedStack() {
  return (
    <div className="k-stagger space-y-2.5">
      {notifications.map((n, i) => (
        <div
          key={n.who}
          style={stagger(i)}
          className={`flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_8px_24px_-14px_rgba(26,16,40,0.35)] ${n.faded ? "opacity-80" : ""}`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7743DB] text-white">
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <span className="flex-1">
            <span className="block text-[14px] font-bold text-[#1A1028]">₦3,000 from {n.who}</span>
            <span className="block text-[12px] text-[#6B6178]">Auto-verified · {n.when}</span>
          </span>
        </div>
      ))}

      <div style={stagger(2)} className="flex items-center gap-3 rounded-2xl border border-dashed border-[#C3ACD0] bg-white/50 p-3.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7EFE5] text-[#6B6178]">
          <X className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block text-[14px] font-semibold text-[#6B6178] line-through decoration-[#7743DB]/60">
            IMG_4021_screenshot.jpg
          </span>
          <span className="block text-[12px] text-[#6B6178]">Not needed. We checked already 💅</span>
        </span>
      </div>
    </div>
  );
}
