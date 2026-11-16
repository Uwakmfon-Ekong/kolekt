export default function Logo({ size = 36, withWord = true }: { size?: number; withWord?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true" style={{ filter: "drop-shadow(0 6px 10px rgba(119,67,219,.3))" }}>
        <defs>
          <linearGradient id="kg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9468EE" />
            <stop offset="1" stopColor="#7743DB" />
          </linearGradient>
        </defs>
        <rect width="80" height="80" rx="24" fill="url(#kg)" />
        <circle cx="62" cy="18" r="22" fill="#C3ACD0" opacity=".28" />
        <path d="M28 21v38" stroke="#fff" strokeWidth="8.5" strokeLinecap="round" />
        <path d="M52 22 34 40l18 18" fill="none" stroke="#fff" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="54" cy="22" r="4.2" fill="#C3ACD0" />
      </svg>
      {withWord && (
        <span className="text-xl font-extrabold tracking-tight">
          Kole<span className="text-primary">kt</span>
        </span>
      )}
    </span>
  );
}
