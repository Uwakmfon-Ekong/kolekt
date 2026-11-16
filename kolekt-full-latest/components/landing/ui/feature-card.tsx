import type { ReactNode } from "react";
import { cn } from "./cn";

/** Shared hover: lift a little with a soft purple shadow. */
export const cardHover =
  "transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(119,67,219,0.45)]";

/** Beige bento card: title + body on top, a UI mockup below. */
export function FeatureCard({
  title,
  body,
  children,
  centerVisual = false,
  className,
}: {
  title: ReactNode;
  body: ReactNode;
  children: ReactNode;
  /** Vertically centre the mockup in the remaining space. */
  centerVisual?: boolean;
  className?: string;
}) {
  return (
    <article className={cn(cardHover, "flex h-full flex-col rounded-[30px] bg-[#F7EFE5] p-7 sm:p-8", className)}>
      <h3 className="text-[22px] font-extrabold tracking-[-0.03em] text-[#1A1028]">{title}</h3>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-[#6B6178]">{body}</p>
      <div className={cn("mt-8 flex-1", centerVisual && "flex items-center")}>{children}</div>
    </article>
  );
}
