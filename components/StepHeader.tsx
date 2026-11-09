import Link from "next/link";
import Icon from "./Icon";

const labels = ["Details", "Contribution", "Contributors", "Review"];

export default function StepHeader({ step, backHref, title = "Create Collection", between }: {
  step: 1 | 2 | 3 | 4; backHref: string; title?: string; between?: React.ReactNode;
}) {
  return (
    <>
      <header className="flex h-14 items-center justify-between">
        <Link href={backHref} aria-label="Back" className="grid h-11 w-11 place-items-center rounded-2xl border border-accent/40 bg-white text-ink shadow-sm transition hover:text-primary active:scale-95">
          <Icon name="back" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        <span className="w-11" />
      </header>
      {between}
      <div className="mt-3" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} aria-label={`Step ${step} of 4`}>
        <div className="mb-2 flex items-center justify-between text-xs font-semibold">
          <span className="text-primary">Step {step} of 4</span>
          <span className="text-muted">{labels[step - 1]}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((i) => <i key={i} className={`h-1.5 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-accent/45"}`} />)}
        </div>
      </div>
    </>
  );
}
