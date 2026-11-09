import type { ReactNode } from "react";
import { cn } from "./cn";
import { Reveal } from "./reveal";

/** Big section title with optional subtitle. Pass an array to force line breaks. */
export function SectionHeading({
  title,
  subtitle,
  align = "left",
  inverse = false,
  size = "md",
  className,
}: {
  title: string | string[];
  subtitle?: ReactNode;
  align?: "left" | "center";
  /** White text, for headings on the purple call-to-action card. */
  inverse?: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  const lines = Array.isArray(title) ? title : [title];
  return (
    <Reveal className={cn(align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl", className)}>
      <h2
        className={cn(
          "font-extrabold tracking-[-0.04em]",
          size === "lg" ? "text-[34px] leading-[1.06] sm:text-[52px]" : "text-[34px] leading-[1.08] sm:text-[46px]",
          inverse ? "text-white" : "text-[#1A1028]",
        )}
      >
        {lines.map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-[16px] leading-relaxed",
            align === "center" && "mx-auto max-w-lg",
            inverse ? "text-white/80" : "text-[#6B6178]",
          )}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
