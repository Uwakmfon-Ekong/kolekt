"use client";

import { useState } from "react";
import Icon from "./Icon";

const base = "w-full rounded-2xl border-[1.5px] bg-bg text-[15.5px] font-medium outline-none transition placeholder:text-[#B1A8B8] focus:bg-white focus:ring-4";
const ok = "border-card focus:border-primary focus:ring-primary/10";
const bad = "border-[#C2344D] focus:border-[#C2344D] focus:ring-[#C2344D]/10";

type Props = {
  id: string; label: string; value: string; onChange: (v: string) => void; onBlur?: () => void;
  error?: string; hint?: string; optional?: boolean; prefix?: string; placeholder?: string;
  type?: "text" | "email" | "tel" | "password"; multiline?: boolean; rows?: number; maxLength?: number;
  autoComplete?: string; inputMode?: "text" | "numeric" | "email" | "tel"; className?: string;
};

export default function Field({
  id, label, value, onChange, onBlur, error, hint, optional, prefix, placeholder, type = "text",
  multiline, rows = 4, maxLength, autoComplete, inputMode, className = "",
}: Props) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  const cls = `${base} ${error ? bad : ok}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold">
        {label}{optional && <span className="font-medium text-muted"> (optional)</span>}
      </label>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15.5px] font-bold text-primary">{prefix}</span>}
        {multiline ? (
          <textarea id={id} rows={rows} maxLength={maxLength} value={value} placeholder={placeholder} aria-invalid={!!error}
            onChange={(e) => onChange(e.target.value)} onBlur={onBlur} className={`${cls} resize-none px-4 py-3.5 leading-relaxed`} />
        ) : (
          <input id={id} type={isPw && show ? "text" : type} value={value} placeholder={placeholder} aria-invalid={!!error}
            autoComplete={autoComplete ?? "off"} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
            className={`${cls} h-[54px] ${prefix ? "pl-9" : "pl-4"} ${isPw ? "pr-12" : "pr-4"}`} />
        )}
        {isPw && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}
            className="absolute right-1.5 top-1.5 grid h-10 w-10 place-items-center rounded-xl text-muted transition hover:bg-card hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <Icon name={show ? "eyeOff" : "eye"} />
          </button>
        )}
      </div>
      {(error || hint || (multiline && maxLength)) && (
        <div className="mt-1.5 flex justify-between gap-3 px-0.5 text-xs">
          {error ? <p role="alert" className="font-medium text-[#C2344D]">{error}</p> : <p className="text-muted">{hint}</p>}
          {multiline && maxLength && <span className="flex-none text-muted">{value.length}/{maxLength}</span>}
        </div>
      )}
    </div>
  );
}
