import "server-only";
import { one } from "./db";
import type { PaymentInstructions } from "./paga";

export type TxView = {
  reference: string;
  status: string;
  amount: number;
  amount_to_pay: number | null;
  payer_name: string;
  payer_details: Record<string, string> | string;
  payment_instructions: PaymentInstructions | string | null;
  payment_method: string | null;
  provider_reference: string | null;
  provider_mode: string;
  verified_at: string | Date | null;
  expires_at: string | Date | null;
  created_at: string | Date;
  title: string;
  slug: string;
  organisation: string;
  organiser_name: string;
  public_code: string;
  collection_type: string;
  fixed_amount: number | null;
  allow_part_payments: boolean;
  paid_to_date: number | null;
};

/** Public view of one payment, by its unguessable reference. */
export async function getTransaction(reference: string) {
  if (!/^KLK-[A-Z0-9]{8,20}$/.test(reference)) return null;
  const t = await one<TxView>(
    `select t.reference, t.status, t.amount, t.amount_to_pay, t.payer_name, t.payer_details, t.payment_instructions,
            t.payment_method, t.provider_reference, t.provider_mode, t.verified_at, t.expires_at, t.created_at,
            c.title, c.slug, c.organisation, c.public_code, o.full_name as organiser_name,
            c.collection_type, c.fixed_amount, c.allow_part_payments,
            (select sum(x.amount) from transactions x
              where x.collection_id = t.collection_id and x.payer_key = t.payer_key and x.status = 'successful'
                and x.verified_at <= coalesce(t.verified_at, now())) as paid_to_date
       from transactions t
       join collections c on c.id = t.collection_id
       join organisers o on o.id = c.organiser_id
      where t.reference = $1`,
    [reference],
  );
  if (!t) return null;
  return {
    ...t,
    payer_details: (typeof t.payer_details === "string" ? JSON.parse(t.payer_details) : t.payer_details) as Record<string, string>,
    payment_instructions: (typeof t.payment_instructions === "string" ? JSON.parse(t.payment_instructions) : t.payment_instructions) as PaymentInstructions | null,
  };
}
