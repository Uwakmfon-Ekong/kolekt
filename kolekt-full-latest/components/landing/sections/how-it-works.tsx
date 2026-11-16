import { STEPS } from "../content";
import { cardHover } from "../ui/feature-card";
import { Reveal } from "../ui/reveal";
import { Ripples } from "../ui/ripples";
import { SectionHeading } from "../ui/section-heading";

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-10 bg-[#F7EFE5]">
      <div className="relative mx-auto max-w-6xl overflow-hidden px-5 py-24 sm:px-8 sm:py-28">
        <Ripples spin="forward" className="absolute -right-28 -top-20 h-96 w-96" />
        <SectionHeading title={STEPS.title} subtitle={STEPS.subtitle} className="relative" />

        <ol className="relative mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.items.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 140}>
              <div className={`${cardHover} h-full rounded-[28px] bg-[#FFFBF5] p-7 ring-1 ring-[#EFE4D4]`}>
                <span className="text-[56px] font-extrabold leading-none tracking-[-0.05em] text-[#C3ACD0]">0{i + 1}</span>
                <h3 className="mt-6 text-[24px] font-extrabold tracking-[-0.03em] text-[#1A1028]">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#6B6178]">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
