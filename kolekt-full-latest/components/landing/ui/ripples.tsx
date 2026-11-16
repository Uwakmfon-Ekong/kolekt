/** Concentric "collecting" rings used as background decoration. */
export function Ripples({
  className = "",
  tone = "brand",
  spin,
}: {
  className?: string;
  tone?: "brand" | "light";
  /** Slowly rotate the dashed rings. */
  spin?: "forward" | "reverse";
}) {
  const stroke = tone === "light" ? "#FFFFFF" : "#7743DB";
  const base = tone === "light" ? 0.1 : 0.07;
  return (
    <svg viewBox="0 0 200 200" className={`pointer-events-none ${spin === "forward" ? "k-spin" : spin === "reverse" ? "k-spin-reverse" : ""} ${className}`} fill="none" aria-hidden>
      {[92, 78, 64, 50, 36, 22].map((r, i) => (
        <circle
          key={r}
          cx="100"
          cy="100"
          r={r}
          stroke={stroke}
          strokeOpacity={base + i * 0.025}
          strokeWidth="1.5"
          strokeDasharray={i % 2 ? "2 6" : undefined}
        />
      ))}
    </svg>
  );
}
