import { Check } from "lucide-react";
import { FEATURES } from "../content";
import { FixedOrFlex } from "../mockups/fixed-or-flex";
import { LiveRoster } from "../mockups/live-roster";
import { ReceiptCard } from "../mockups/receipt-card";
import { ShareCard } from "../mockups/share-card";
import { VerifiedStack } from "../mockups/verified-stack";
import { cardHover, FeatureCard } from "../ui/feature-card";
import { Reveal } from "../ui/reveal";
import { SectionHeading } from "../ui/section-heading";

export function Features() {
  const f = FEATURES;
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-10 px-5 py-24 sm:px-8 sm:py-28">
      <SectionHeading title={f.title} subtitle={f.subtitle} align="center" />

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        <Reveal>
          <FeatureCard title={f.verified.title} body={f.verified.body}>
            <VerifiedStack />
          </FeatureCard>
        </Reveal>

        <Reveal delay={120}>
          <FeatureCard title={f.flexible.title} body={f.flexible.body}>
            <FixedOrFlex />
          </FeatureCard>
        </Reveal>

        {/* Wide card */}
        <Reveal className="md:col-span-2">
          <article
            className={`${cardHover} grid items-center gap-10 rounded-[30px] bg-[#F7EFE5] p-7 sm:p-10 md:grid-cols-[0.9fr_1.1fr]`}
          >
            <div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7743DB] text-white">
                <Check className="h-6 w-6" strokeWidth={3} />
              </span>
              <h3 className="mt-5 text-[28px] font-extrabold leading-tight tracking-[-0.035em] text-[#1A1028] sm:text-[32px]">
                {f.tracking.title[0]}
                <br />
                {f.tracking.title[1]}
              </h3>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#6B6178]">{f.tracking.body}</p>
            </div>
            <div className="pb-6 sm:px-6">
              <LiveRoster />
            </div>
          </article>
        </Reveal>

        <Reveal>
          <FeatureCard title={f.share.title} body={f.share.body} centerVisual>
            <ShareCard />
          </FeatureCard>
        </Reveal>

        <Reveal delay={120}>
          <FeatureCard title={f.receipts.title} body={f.receipts.body}>
            <div className="sm:px-4">
              <ReceiptCard />
            </div>
          </FeatureCard>
        </Reveal>
      </div>
    </section>
  );
}
