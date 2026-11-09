"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "./cn";

/**
 * Fades and slides its children in the first time they scroll into view.
 * Styling lives in landing.css (.k-reveal / .is-visible), so reduced-motion
 * users and no-JS visitors still see everything.
 */
export function Reveal({
  children,
  delay = 0,
  as = "div",
  className,
  style,
}: {
  children: ReactNode;
  /** Milliseconds to wait after the element enters the viewport. */
  delay?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={cn("k-reveal", visible && "is-visible", className)}
      style={{ ...style, transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
