import { FINAL_CTA, ROUTES } from "../content";
import { PillLink } from "../ui/pill-link";
import { Reveal } from "../ui/reveal";
import { Ripples } from "../ui/ripples";
import { SectionHeading } from "../ui/section-heading";

export function FinalCta() {
  return (
    <section className="px-5 pb-20 sm:px-8">
      <Reveal className="relative mx-auto max-w-[68rem] overflow-hidden rounded-[36px] bg-[#7743DB] px-7 py-16 text-center sm:px-12 sm:py-20">
        <div
          className="k-breathe pointer-events-none absolute inset-x-0 -top-40 mx-auto h-80 w-[90%] rounded-full blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(195,172,208,0.7), rgba(195,172,208,0))" }}
          aria-hidden
        />
        <Ripples tone="light" spin="forward" className="absolute -left-20 -top-20 h-72 w-72" />
        <Ripples tone="light" spin="reverse" className="absolute -bottom-24 -right-16 h-72 w-72" />

        <div className="relative">
          <SectionHeading title={FINAL_CTA.title} subtitle={FINAL_CTA.subtitle} align="center" size="lg" inverse />
          <PillLink href={ROUTES.start} variant="light" arrow className="mt-9">
            {FINAL_CTA.cta}
          </PillLink>
        </div>
      </Reveal>
    </section>
  );
}
