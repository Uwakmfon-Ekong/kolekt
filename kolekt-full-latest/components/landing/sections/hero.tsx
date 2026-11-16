import { HERO, ROUTES } from "../content";
import { PhoneMockup } from "../mockups/phone-mockup";
import { PillLink } from "../ui/pill-link";
import { Ripples } from "../ui/ripples";
import { delay } from "../ui/motion";
import { HeroFloatingCards } from "./hero-floating-cards";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#FFFBF5]">
      <HeroBackdrop />

      {/* Headline */}
      <div className="relative z-30 mx-auto max-w-3xl px-5 pt-10 text-center sm:pt-16">
        <span style={delay(0)} className="k-enter inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#6B6178] shadow-[0_6px_20px_-12px_rgba(119,67,219,0.5)] ring-1 ring-[#EFE4D4]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="kolekt-ping absolute inline-flex h-full w-full rounded-full bg-[#7743DB]" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#7743DB]" />
          </span>
          {HERO.badge}
        </span>
        <h1 style={delay(100)} className="k-enter mt-6 text-[40px] font-extrabold leading-[1.02] tracking-[-0.045em] text-[#1A1028] sm:text-[68px]">
          {HERO.titleLines[0]}
          <br />
          {HERO.titleLines[1]}
        </h1>
        <p style={delay(220)} className="k-enter mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-[#6B6178] sm:text-[18px]">{HERO.subtitle}</p>
        <div style={delay(340)} className="k-enter mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PillLink href={ROUTES.start} arrow>
            {HERO.primaryCta}
          </PillLink>
          <PillLink href="#how" variant="outline">
            {HERO.secondaryCta}
          </PillLink>
        </div>
      </div>

      {/* Phone stage */}
      <div className="relative mt-16 h-[470px] sm:h-[520px]">
        <HeroGlow />
        <div className="relative z-10 mx-auto max-w-6xl px-5">
          <div style={delay(450)} className="k-rise">
            <PhoneMockup />
          </div>
          <HeroFloatingCards />
        </div>
        {/* Fade the phone into the page */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-44 bg-gradient-to-b from-transparent via-[#FFFBF5]/85 to-[#FFFBF5]"
          aria-hidden
        />
      </div>
    </section>
  );
}

/** Soft lilac and beige shapes, echoing the login screen. */
function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
      <div className="absolute -right-40 -top-48 h-[560px] w-[560px] rounded-full bg-[#C3ACD0]/35" />
      <div className="absolute -left-40 top-[22rem] h-[420px] w-[420px] rounded-full bg-[#F7EFE5]" />
      <Ripples spin="forward" className="absolute -left-24 top-36 h-72 w-72 sm:h-96 sm:w-96" />
      <Ripples spin="reverse" className="absolute -right-20 top-24 h-72 w-72 sm:h-96 sm:w-96" />
    </div>
  );
}

/** Lilac glow band behind the phone, fading into the cream page. */
function HeroGlow() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[380px]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,251,245,0) 0%, rgba(195,172,208,0.55) 40%, rgba(195,172,208,0.45) 62%, #FFFBF5 94%)",
        }}
        aria-hidden
      />
      <div
        className="k-breathe pointer-events-none absolute bottom-20 left-1/2 z-0 h-72 w-[860px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(119,67,219,0.38), rgba(195,172,208,0))" }}
        aria-hidden
      />
    </>
  );
}
