import { Plus } from "lucide-react";
import { FAQ } from "../content";
import { Reveal } from "../ui/reveal";
import { SectionHeading } from "../ui/section-heading";

export function Faq() {
  return (
    <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-10 gap-10 px-5 py-24 sm:px-8 sm:py-28 lg:grid-cols-[0.8fr_1.2fr]">
      <SectionHeading title={FAQ.title} subtitle={FAQ.subtitle} />

      <div className="space-y-3">
        {FAQ.items.map((item, i) => (
          <Reveal key={item.q} delay={i * 80}>
            <FaqItem question={item.q} answer={item.a} defaultOpen={i === 0} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Native <details> accordion: accessible and no JavaScript needed. */
function FaqItem({ question, answer, defaultOpen }: { question: string; answer: string; defaultOpen?: boolean }) {
  return (
    <details
      className="group rounded-[22px] bg-[#F7EFE5] px-6 py-5 transition-colors duration-300 open:bg-white open:ring-1 open:ring-[#EFE4D4] hover:bg-[#F3E8DA] open:hover:bg-white"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-bold text-[#1A1028] [&::-webkit-details-marker]:hidden">
        {question}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFFBF5] transition-all duration-300 group-open:rotate-45 group-open:bg-[#7743DB] group-open:text-white">
          <Plus className="h-4 w-4" />
        </span>
      </summary>
      <p className="k-faq-answer mt-3 pr-10 text-[15px] leading-relaxed text-[#6B6178]">{answer}</p>
    </details>
  );
}
