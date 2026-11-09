import Icon from "./Icon";

export default function Checkbox({ checked, onChange, error, children }: {
  checked: boolean; onChange: (v: boolean) => void; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-[13.5px] font-medium leading-snug">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={`mt-px grid h-[22px] w-[22px] flex-none place-items-center rounded-[7px] border-[1.5px] transition peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20 ${checked ? "border-primary bg-primary" : error ? "border-[#C2344D] bg-white" : "border-accent bg-white"}`}>
          {checked && <Icon name="check" className="h-3.5 w-3.5 text-white" width={3.5} />}
        </span>
        <span>{children}</span>
      </label>
      {error && <p role="alert" className="mt-1.5 pl-[34px] text-xs font-medium text-[#C2344D]">{error}</p>}
    </div>
  );
}
