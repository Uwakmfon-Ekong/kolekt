import { AUDIENCES } from "../content";

/** Endless scrolling strip of the groups Kolekt is for. */
export function AudienceMarquee() {
  const items = [...AUDIENCES, ...AUDIENCES]; // doubled so the loop is seamless
  return (
    <section className="k-marquee-wrap relative overflow-hidden border-y border-[#EFE4D4] bg-[#FFFBF5] py-5" aria-label="Who uses Kolekt">
      <div className="kolekt-marquee flex w-max items-center gap-8">
        {items.map((a, i) => (
          <span
            key={i}
            className="flex items-center gap-8 whitespace-nowrap text-[15px] font-semibold text-[#6B6178]"
            aria-hidden={i >= AUDIENCES.length}
          >
            {a}
            <span className="text-[#C3ACD0]">✦</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#FFFBF5] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#FFFBF5] to-transparent" />
    </section>
  );
}
