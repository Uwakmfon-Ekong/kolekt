import { cn } from "./cn";

/** The purple K app icon (same artwork as components/Logo.tsx). */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={cn("shrink-0", className)}
      style={{ filter: "drop-shadow(0 6px 10px rgba(119,67,219,.3))" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="kolekt-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9468EE" />
          <stop offset="1" stopColor="#7743DB" />
        </linearGradient>
      </defs>
      <rect width="80" height="80" rx="24" fill="url(#kolekt-mark)" />
      <circle cx="62" cy="18" r="22" fill="#C3ACD0" opacity=".28" />
      <path d="M28 21v38" stroke="#fff" strokeWidth="8.5" strokeLinecap="round" />
      <path d="M52 22 34 40l18 18" fill="none" stroke="#fff" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="54" cy="22" r="4.2" fill="#C3ACD0" />
    </svg>
  );
}

/** "Kolekt" with the purple "kt". */
export function Wordmark({ inverse = false, className = "text-[22px]" }: { inverse?: boolean; className?: string }) {
  return (
    <span className={cn("font-extrabold tracking-[-0.03em]", inverse ? "text-white" : "text-[#1A1028]", className)}>
      Kole<span className="text-[#7743DB]">kt</span>
    </span>
  );
}

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <Wordmark inverse={inverse} />
    </span>
  );
}
