import "server-only";

/**
 * Paga Checkout (hosted payment page). A separate product from the Collect API.
 * Docs: https://developer-docs.paga.com/docs/checkout-js
 *       https://developer-docs.paga.com/reference/checkout-verifycheckoutcharge
 *
 *  1. Send the customer to the payment page (checkoutUrl).
 *  2. Paga redirects them to charge_url with ?charge_reference=…&status_code=…&status_message=…
 *     The redirect alone proves nothing.
 *  3. Confirm on the server with verifyCheckout before counting the money.
 */
const HOST = { sandbox: "https://beta-checkout.paga.com", live: "https://checkout.paga.com" };
// Same environment switch as the Collect client (lib/server/paga.ts), read directly to avoid a circular import.
const host = () => (process.env.PAGA_ENV === "live" ? HOST.live : HOST.sandbox);

export function checkoutUrl(input: {
  reference: string;
  amount: number;
  email: string;
  phoneNumber?: string | null;
  chargeUrl: string;
  callbackUrl: string;
  fundingSources?: string[];
}) {
  const params = new URLSearchParams({
    public_key: process.env.PAGA_PUBLIC_KEY ?? "",
    amount: input.amount.toFixed(2),
    currency: "NGN",
    payment_reference: input.reference,
    email: input.email,
    charge_url: input.chargeUrl,
    callback_url: input.callbackUrl,
    funding_sources: (input.fundingSources ?? ["TRANSFER", "CARD", "USSD", "PAGA"]).join(","),
  });
  if (input.phoneNumber) params.set("phone_number", input.phoneNumber);
  return `${host()}/checkout/params?${params}`;
}

export type CheckoutVerification = {
  paid: boolean;
  statusCode: number | string | null;
  statusMessage: string | null;
  amount: number | null;
  httpStatus: number;
  raw: unknown;
};

/** Ask Paga whether a Checkout payment really went through. Basic auth: public key : secret key. */
export async function verifyCheckout(reference: string, amount: number): Promise<CheckoutVerification> {
  const auth = Buffer.from(`${process.env.PAGA_PUBLIC_KEY}:${process.env.PAGA_SECRET_KEY}`).toString("base64");
  const res = await fetch(`${host()}/checkout/transaction/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({ paymentReference: reference, publicKey: process.env.PAGA_PUBLIC_KEY, amount, currency: "NGN" }),
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  let raw: unknown = text;
  try { raw = JSON.parse(text); } catch { /* not JSON */ }
  const r = (raw ?? {}) as Record<string, unknown>;
  const statusCode = (r.status_code ?? r.statusCode ?? null) as number | string | null;
  const paidAmount = r.amount != null ? Number(r.amount) : null;
  return {
    // Paid only if Paga says so AND the amount matches what we asked for.
    paid: res.ok && Number(statusCode) === 0 && paidAmount !== null && Math.abs(paidAmount - amount) < 0.01,
    statusCode,
    statusMessage: (r.status_message ?? r.statusMessage ?? null) as string | null,
    amount: paidAmount,
    httpStatus: res.status,
    raw,
  };
}
