import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { ROUTES, USE_CASES } from "../content";
import { cardHover } from "../ui/feature-card";
import { Reveal } from "../ui/reveal";
import { SectionHeading } from "../ui/section-heading";

export function UseCases() {
  const u = USE_CASES;
  return (
    <section id="who" className="scroll-mt-10 bg-[#F7EFE5]">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <SectionHeading title={u.title} subtitle={u.subtitle} />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {u.items.map((item, i) => (
            <Reveal as="li" key={item.title} delay={(i % 3) * 110}>
              <div className={`${cardHover} group h-full rounded-[26px] bg-[#FFFBF5] p-6`}>
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C3ACD0]/35 text-[24px] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                  aria-hidden
                >
                  {item.emoji}
                </span>
                <h3 className="mt-5 text-[18px] font-extrabold tracking-[-0.02em] text-[#1A1028]">{item.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#6B6178]">{item.body}</p>
              </div>
            </Reveal>
          ))}

          <Reveal as="li" delay={220}>
            <Link
              href={ROUTES.start}
              className="group flex h-full min-h-[180px] flex-col justify-between rounded-[26px] border-2 border-dashed border-[#C3ACD0] p-6 transition-colors hover:border-[#7743DB] hover:bg-[#FFFBF5]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7743DB] text-white transition-transform duration-300 group-hover:rotate-90">
                <Plus className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-[18px] font-extrabold tracking-[-0.02em] text-[#1A1028]">{u.extra.title}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-[14px] font-semibold text-[#7743DB]">
                  {u.extra.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </Link>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
