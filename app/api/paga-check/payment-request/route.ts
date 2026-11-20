import { getOrganiser } from "@/lib/server/auth";
import { appUrl } from "@/lib/server/app-url";
import { collectTestPaymentRequest } from "@/lib/server/paga";

export const dynamic = "force-dynamic";

/**
 * Organisers only, sandbox only: sends Paga's documented "create a payment request" example
 * from this server (so from its whitelisted IP) and shows exactly what was sent and what Paga replied.
 *   /api/paga-check/payment-request?phone=07010891180&email=you@example.com  (email defaults to yours)
 */
export async function GET(req: Request) {
  const me = await getOrganiser();
  if (!me) return new Response("Please log in first, then open this page again.", { status: 401 });
  const phone = (new URL(req.url).searchParams.get("phone") ?? "").replace(/\D/g, "");
  if (!/^0\d{10}$/.test(phone)) return new Response("Add ?phone=0XXXXXXXXXX (an 11-digit Nigerian number).", { status: 400 });
  // payer.email: ?email=… if given, otherwise the logged-in organiser's email.
  const email = (new URL(req.url).searchParams.get("email") ?? me.email).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return new Response("That email doesn't look right. Use ?email=name@example.com", { status: 400 });
  const result = await collectTestPaymentRequest({ phoneNumber: phone, email, callBackUrl: `${await appUrl()}/api/webhooks/paga` });
  return new Response(JSON.stringify(result, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
