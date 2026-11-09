import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { COMPARISON } from "../content";
import { LogoMark } from "../ui/logo";
import { stagger } from "../ui/motion";
import { Reveal } from "../ui/reveal";
import { SectionHeading } from "../ui/section-heading";

/** "The group-chat way" vs "The Kolekt way". */
export function Comparison() {
  const c = COMPARISON;
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
      <SectionHeading title={c.title} align="center" />

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        <Reveal className="h-full">
          <div className="h-full rounded-[30px] border border-[#EFE4D4] bg-white p-7 sm:p-9">
            <p className="text-[14px] font-bold text-[#6B6178]">{c.oldLabel}</p>
            <ul className="k-stagger mt-6 space-y-4">
              {c.oldWay.map((t, i) => (
                <ListItem key={t} index={i} icon={<X className="h-3.5 w-3.5" strokeWidth={3} />} iconClass="bg-[#F7EFE5]" textClass="text-[#6B6178]">
                  {t}
                </ListItem>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={150} className="h-full">
          <div className="relative h-full overflow-hidden rounded-[30px] bg-[#7743DB] p-7 text-white sm:p-9">
            <span className="k-spin absolute -right-16 -top-16 h-56 w-56 rounded-full border-[36px] border-dashed border-white/[0.07]" aria-hidden />
            <p className="relative inline-flex items-center gap-2 text-[14px] font-bold text-white/80">
              <LogoMark className="h-6 w-6" /> {c.newLabel}
            </p>
            <ul className="k-stagger relative mt-6 space-y-4">
              {c.kolektWay.map((t, i) => (
                <ListItem key={t} index={i + 2} icon={<Check className="h-3.5 w-3.5" strokeWidth={3} />} iconClass="bg-white text-[#7743DB]" textClass="font-medium">
                  {t}
                </ListItem>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ListItem({
  index,
  icon,
  iconClass,
  textClass,
  children,
}: {
  index: number;
  icon: ReactNode;
  iconClass: string;
  textClass: string;
  children: ReactNode;
}) {
  return (
    <li style={stagger(index)} className={`flex gap-3 text-[16px] ${textClass}`}>
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconClass}`}>{icon}</span>
      {children}
    </li>
  );
}
