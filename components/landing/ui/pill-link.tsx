import Link from "next/link";
import type { ComponentProps } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "./cn";

const variants = {
  /** Purple, glowing: the main call to action. */
  brand: "bg-[#7743DB] text-white font-bold shadow-[0_10px_30px_-8px_rgba(119,67,219,0.9)] hover:bg-[#8653E6] hover:-translate-y-px",
  /** White pill with a soft border, for light backgrounds. */
  outline: "bg-white text-[#1A1028] font-semibold ring-1 ring-[#E9DDCB] hover:ring-[#C3ACD0]",
  /** White pill for purple backgrounds. */
  light: "bg-white text-[#1A1028] font-bold hover:-translate-y-px",
};

const sizes = {
  sm: "h-10 px-5 text-[14px]",
  lg: "h-[52px] px-7 text-[15px]",
};

type Props = ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Show a trailing arrow that nudges right on hover. */
  arrow?: boolean;
};

export function PillLink({ variant = "brand", size = "lg", arrow, className, children, ...props }: Props) {
  return (
    <Link
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full transition-all",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {variant !== "outline" && <span className="k-shine pointer-events-none absolute inset-0" aria-hidden />}
      <span className="relative inline-flex items-center gap-2">
        {children}
        {arrow && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />}
      </span>
    </Link>
  );
}
