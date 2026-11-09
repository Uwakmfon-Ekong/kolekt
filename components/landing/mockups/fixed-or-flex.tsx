import { CountUp } from "../ui/count-up";
import { stagger } from "../ui/motion";

const amounts = ["₦2,000", "₦5,000", "₦10,000"];
const SELECTED = 1;

/** Fixed / Flexible toggle with amount chips and progress to a target. */
export function FixedOrFlex() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_-14px_rgba(26,16,40,0.35)]">
      <div className="grid grid-cols-2 rounded-full bg-[#F7EFE5] p-1 text-[13px] font-semibold">
        <span className="rounded-full py-2 text-center text-[#6B6178]">Fixed</span>
        <span className="rounded-full bg-[#1A1028] py-2 text-center text-white">Flexible</span>
      </div>

      <p className="mt-5 text-[12px] font-medium text-[#6B6178]">Pick an amount</p>
      <div className="k-stagger mt-2 flex flex-wrap gap-2">
        {amounts.map((a, i) => (
          <span
            key={a}
            style={stagger(i)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
              i === SELECTED ? "bg-[#7743DB] text-white" : "bg-[#F7EFE5] text-[#1A1028]"
            }`}
          >
            {a}
          </span>
        ))}
        <span style={stagger(3)} className="rounded-full border border-dashed border-[#C3ACD0] px-3.5 py-1.5 text-[13px] font-semibold text-[#6B6178]">
          Other
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-[12px] text-[#6B6178]">Raised for the project</p>
          <CountUp value={312000} prefix="₦" className="block text-[22px] font-extrabold tracking-[-0.02em] text-[#1A1028]" />
        </div>
        <p className="text-[12px] font-semibold text-[#7743DB]">62% of ₦500k</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F7EFE5]">
        <div className="k-grow h-full w-[62%] rounded-full bg-gradient-to-r from-[#C3ACD0] to-[#7743DB]" />
      </div>
    </div>
  );
}
