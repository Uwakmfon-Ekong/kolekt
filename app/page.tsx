import { Navbar } from "@/components/landing/sections/navbar";
import { Hero } from "@/components/landing/sections/hero";
import { AudienceMarquee } from "@/components/landing/sections/audience-marquee";
import { Features } from "@/components/landing/sections/features";
import { HowItWorks } from "@/components/landing/sections/how-it-works";
import { Comparison } from "@/components/landing/sections/comparison";
import { UseCases } from "@/components/landing/sections/use-cases";
import { Faq } from "@/components/landing/sections/faq";
import { FinalCta } from "@/components/landing/sections/final-cta";
import { Footer } from "@/components/landing/sections/footer";
// import "@/components/landing/landing.css";

/** Landing page at "/". Its buttons lead to /login (see ROUTES in components/landing/content.ts). */
export default function Home() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1A1028] antialiased">
     
      <noscript
        dangerouslySetInnerHTML={{
          __html: "<style>.k-reveal,.k-stagger>*{opacity:1!important;translate:none!important}</style>",
        }}
      />
      <Navbar />
      <Hero />
      <AudienceMarquee />
      <main>
        <Features />
        <HowItWorks />
        <Comparison />
        <UseCases />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
