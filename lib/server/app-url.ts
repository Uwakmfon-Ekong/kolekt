import "server-only";
import { headers } from "next/headers";

/**
 * Public base URL. Paga must be able to reach `${appUrl}/api/webhooks/paga`,
 * so set APP_URL to your Vercel URL (or an ngrok tunnel) when using real keys.
 */
export async function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
