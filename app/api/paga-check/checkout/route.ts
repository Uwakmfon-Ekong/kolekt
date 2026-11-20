import { getOrganiser } from "@/lib/server/auth";
import { appUrl } from "@/lib/server/app-url";
import { pagaMode } from "@/lib/server/paga";
import { checkoutUrl, verifyCheckout } from "@/lib/server/paga-checkout";

export const dynamic = "force-dynamic";

const AMOUNT = 100;
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

/**
 * Organisers only, sandbox only: test Paga Checkout from this (whitelisted) server.
 *   /api/paga-check/checkout          1) checks the verify endpoint, 2) gives you a ₦100 sandbox payment link
 *   /api/paga-check/checkout?return=1  Paga sends you back here after paying; we verify the payment with Paga
 */
export async function GET(req: Request) {
  const me = await getOrganiser();
  if (!me) return new Response("Please log in first, then open this page again.", { status: 401 });
  if (pagaMode() !== "sandbox") return json({ error: "This test only runs with sandbox keys." }, 400);

  const url = new URL(req.url);
  const base = await appUrl();

  if (url.searchParams.get("return")) {
    // Paga appends charge_reference, status_code and status_message. Never trust them alone.
    const reference = url.searchParams.get("charge_reference") ?? url.searchParams.get("ref") ?? "";
    const verification = reference ? await verifyCheckout(reference, AMOUNT) : null;
    return json({
      step: "2. Back from Paga Checkout",
      pagaSentBack: Object.fromEntries(url.searchParams),
      serverVerification: verification,
      verdict: verification?.paid
        ? "✓ Checkout works end to end: Paga confirmed the payment on the server."
        : "✗ Not confirmed. See serverVerification for Paga's reply.",
    });
  }

  const reference = `KCO-${Date.now()}`;
  const probe = await verifyCheckout(`KCO-NOPE-${Date.now()}`, AMOUNT);
  return json({
    step: "1. Checkout test",
    verifyEndpointCheck: {
      what: "Asked Paga to verify a made-up reference from this server. A working setup answers with a 'not found' or 'pending' style code; 401 means Paga isn't accepting the keys (or this IP) for Checkout.",
      httpStatus: probe.httpStatus,
      reply: probe.raw,
    },
    payWithThisLink: checkoutUrl({
      reference,
      amount: AMOUNT,
      email: me.email,
      phoneNumber: me.phone,
      chargeUrl: `${base}/api/paga-check/checkout?return=1&ref=${reference}`,
      callbackUrl: `${base}/api/webhooks/paga-checkout`,
    }),
    howToPay: "Open payWithThisLink. Sandbox card: 4187427415564246, expiry 09/32, CVV 828, password 3310, OTP 12345. Paga then sends you back here and the payment is verified on the server.",
  });
}
