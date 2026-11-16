"use client";

import Icon from "@/components/Icon";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-12 items-center gap-2 rounded-2xl border-[1.5px] border-accent/50 bg-white px-5 text-sm font-bold transition hover:border-primary"
    >
      <Icon name="download" className="h-4 w-4" /> Save or print receipt
    </button>
  );
}
