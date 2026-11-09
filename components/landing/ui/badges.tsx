import { BadgeCheck, Check } from "lucide-react";
import { cn } from "./cn";

/** Small purple "Verified" tag. */
export function VerifiedBadge({ size = "md" }: { size?: "sm" | "md" }) {
  return size === "sm" ? (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#7743DB]">
      <BadgeCheck className="h-3 w-3" aria-hidden /> Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#7743DB]/10 px-2.5 py-1 text-[11px] font-bold text-[#7743DB]">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified
    </span>
  );
}

/** "Paid" / "Not yet" status chip used in the roster mockup. */
export function PaidStatus({ paid }: { paid: boolean }) {
  return paid ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#7743DB]/10 px-2.5 py-1 text-[11px] font-bold text-[#7743DB]">
      <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> Paid
    </span>
  ) : (
    <span className="rounded-full bg-[#F7EFE5] px-2.5 py-1 text-[11px] font-bold text-[#6B6178]">Not yet</span>
  );
}

/** Initials avatar. */
export function Avatar({ initials, color = "#C3ACD0", className }: { initials: string; color?: string; className?: string }) {
  return (
    <span
      className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#1A1028]", className)}
      style={{ background: color }}
    >
      {initials}
    </span>
  );
}
