import { FileSpreadsheet } from "lucide-react";
import { VerifiedBadge } from "../ui/badges";
import { LogoMark } from "../ui/logo";

const rows: [string, string][] = [
  ["Paid by", "Edidiong Akpan"],
  ["For", "300L Departmental Dues"],
  ["Ref", "KLK-7F3QX9MZ"],
];

/** A verified receipt with a "report.csv" tag. */
export function ReceiptCard() {
  return (
    <div className="relative">
      <div className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_-14px_rgba(26,16,40,0.35)]">
        <div className="flex items-center justify-between">
          <LogoMark className="h-7 w-7" />
          <VerifiedBadge />
        </div>
        <p className="mt-4 text-[12px] text-[#6B6178]">Amount paid</p>
        <p className="text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-[#1A1028]">₦3,000</p>
        <dl className="mt-3 space-y-1.5 border-t border-dashed border-[#E9DDF0] pt-3 text-[12px]">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-[#6B6178]">{label}</dt>
              <dd className="truncate font-semibold text-[#1A1028]">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <span className="k-bob absolute -right-3 -top-4 inline-flex rotate-6 items-center gap-1.5 rounded-full bg-[#1A1028] px-3.5 py-2 text-[12px] font-semibold text-white shadow-lg">
        <FileSpreadsheet className="h-3.5 w-3.5" /> report.csv
      </span>
    </div>
  );
}
