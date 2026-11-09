import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";
type Style = { variant?: Variant; size?: Size; full?: boolean };

const base =
  "flex items-center justify-center gap-2 font-bold transition active:scale-[.985] disabled:cursor-progress disabled:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const variants: Record<Variant, string> = {
  primary: "bg-gradient-to-b from-[#8553E6] to-primary text-white shadow-cta hover:to-primary-dark",
  secondary: "border-[1.5px] border-accent/50 bg-white text-ink hover:border-primary",
  ghost: "text-primary hover:bg-card",
};
const sizes: Record<Size, string> = { md: "h-12 rounded-2xl px-5 text-[15px]", lg: "h-14 rounded-[18px] px-6 text-base" };

const cls = ({ variant = "primary", size = "lg", full = true }: Style, extra = "") =>
  `${base} ${variants[variant]} ${sizes[size]} ${full ? "w-full" : ""} ${extra}`;

export function Spinner({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span aria-hidden="true" className={`h-5 w-5 animate-spin rounded-full border-[2.5px] ${tone === "light" ? "border-white/35 border-t-white" : "border-primary/25 border-t-primary"}`} />
  );
}

export function Button({
  variant, size, full, loading, loadingText, className = "", children, disabled, ...rest
}: ComponentProps<"button"> & Style & { loading?: boolean; loadingText?: string }) {
  return (
    <button {...rest} disabled={disabled || loading} aria-busy={loading || undefined} className={cls({ variant, size, full }, className)}>
      {loading && <Spinner tone={!variant || variant === "primary" ? "light" : "dark"} />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

export function LinkButton({ variant, size, full, className = "", ...rest }: ComponentProps<typeof Link> & Style) {
  return <Link {...rest} className={cls({ variant, size, full }, className)} />;
}
