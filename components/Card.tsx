import Icon, { IconName } from "./Icon";

export function Card({ children, className = "", tone = "white" }: { children: React.ReactNode; className?: string; tone?: "white" | "tinted" }) {
  return (
    <div className={`rounded-[28px] border ${tone === "white" ? "border-accent/30 bg-white shadow-soft" : "border-white/70 bg-card shadow-soft"} ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-accent bg-card/60 px-6 py-12 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-primary shadow-sm"><Icon name={icon} className="h-7 w-7" /></span>
      <p className="mt-4 text-base font-bold">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{text}</p>}
      {action && <div className="mx-auto mt-5 max-w-xs">{action}</div>}
    </div>
  );
}
