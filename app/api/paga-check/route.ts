import { getOrganiser } from "@/lib/server/auth";
import { appUrl } from "@/lib/server/app-url";
import { collectPing } from "@/lib/server/paga";
import { businessPing } from "@/lib/server/paga-business";

export const dynamic = "force-dynamic";

/** The address Paga sees when this server calls it: this is the IP to whitelist. */
async function outboundIp() {
  for (const url of ["https://api.ipify.org?format=json", "https://ifconfig.me/ip", "https://icanhazip.com"]) {
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      const text = (await res.text()).trim();
      const ip = text.startsWith("{") ? JSON.parse(text).ip : text;
      if (/^[\d.:a-f]+$/i.test(ip)) return ip;
    } catch { /* try the next one */ }
  }
  return "unknown";
}

/** Organisers only: everything needed to finish the Paga setup, plus a live test of both APIs. */
export async function GET() {
  const me = await getOrganiser();
  if (!me) return new Response("Please log in first, then open this page again.", { status: 401 });
  const base = await appUrl();
  const [ip, collect, business] = await Promise.all([outboundIp(), collectPing(), businessPing()]);
  const report = {
    "1. IP address to whitelist with Paga (Collect and Business)": ip,
    "2. Webhook / callback URLs to give Paga": {
      "Collect payment notifications": `${base}/api/webhooks/paga`,
      "Business deposit-to-bank (payout & refund) status": `${base}/api/webhooks/paga-payout`,
    },
    "3. Paga Collect API": collect,
    "4. Paga Business API": business,
    "APP_URL in use": base,
    note: "Run this check a few times. If the IP changes between runs, your host uses changing IPs; tell Paga or ask your host for a static outbound IP.",
  };
  return new Response(JSON.stringify(report, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
