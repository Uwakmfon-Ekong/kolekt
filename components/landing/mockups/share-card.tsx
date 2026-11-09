import { Copy, MessageCircle } from "lucide-react";
import { QrCode } from "./qr-code";

/** QR code + copyable link + "send to the group chat" button. */
export function ShareCard() {
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
      <div className="shrink-0 self-start rounded-2xl bg-white p-3 shadow-[0_8px_24px_-14px_rgba(26,16,40,0.35)] sm:self-auto">
        <QrCode />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 shadow-[0_8px_24px_-14px_rgba(26,16,40,0.35)]">
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#1A1028]">kolekt.app/c/final-year-dinner</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7743DB] text-white">
            <Copy className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#1A1028] px-4 py-2 text-[13px] font-semibold text-white">
          <MessageCircle className="h-4 w-4" /> Send to the group chat
        </span>
      </div>
    </div>
  );
}
