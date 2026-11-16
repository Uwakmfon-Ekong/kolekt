import "server-only";
import { q } from "./db";
import type { Notice } from "../data";

const naira = (n: number) => "₦" + Number(n || 0).toLocaleString("en-NG");

/** The organiser's notifications: verified payments, flagged repeats and payout updates, newest first. */
export async function listNotices(organiserId: string, limit = 60): Promise<Notice[]> {
  const [pays, outs] = await Promise.all([
    q<{ reference: string; payer_name: string; amount: number; title: string; collection_id: string; verified_at: string | Date; review_status: string }>(
      `select t.reference, t.payer_name, t.amount, c.title, c.id as collection_id, t.verified_at, t.review_status
         from transactions t join collections c on c.id = t.collection_id
        where c.organiser_id = $1 and t.status = 'successful'
        order by t.verified_at desc limit $2`,
      [organiserId, limit],
    ),
    q<{ reference: string; amount: number; status: string; bank_name: string; account_number: string; account_name: string; kind: string; title: string; collection_id: string; created_at: string | Date; updated_at: string | Date; message: string | null }>(
      `select p.reference, p.amount, p.status, p.bank_name, p.account_number, p.account_name, p.kind, c.title, c.id as collection_id, p.created_at, p.updated_at, p.message
         from payouts p join collections c on c.id = p.collection_id
        where p.organiser_id = $1
        order by p.updated_at desc limit $2`,
      [organiserId, limit],
    ),
  ]);

  const notices: Notice[] = pays.map((t) => {
    const flagged = t.review_status !== "none";
    return {
      id: `pay:${t.reference}`,
      kind: flagged ? "flag" : "payment",
      title: flagged ? "Possible repeat payment" : "Payment received",
      text: flagged
        ? `${t.payer_name} paid ${naira(Number(t.amount))} to ${t.title} again. Check it on the contributors page.`
        : `${t.payer_name} contributed ${naira(Number(t.amount))} to ${t.title}`,
      at: new Date(t.verified_at).toISOString(),
      href: flagged ? `/collections/${t.collection_id}/contributors` : `/collections/${t.collection_id}`,
    };
  });
  for (const p of outs) {
    const amount = naira(Number(p.amount));
    const refund = p.kind === "refund";
    const to = refund ? `${p.account_name} (${p.bank_name})` : `${p.bank_name} ••${p.account_number.slice(-4)}`;
    const href = refund ? `/collections/${p.collection_id}/contributors` : `/collections/${p.collection_id}`;
    const what = refund ? "Refund" : "Withdrawal";
    notices.push(
      p.status === "successful"
        ? { id: `out:${p.reference}`, kind: "payout_ok", title: `${what} paid`, text: refund ? `${amount} from ${p.title} was refunded to ${to}` : `${amount} from ${p.title} was sent to ${to}`, at: new Date(p.updated_at).toISOString(), href }
        : p.status === "failed"
          ? { id: `out:${p.reference}`, kind: "payout_failed", title: `${what} failed`, text: `${amount} from ${p.title} couldn’t be sent to ${to}${p.message ? `: ${p.message}` : ""}. The money is back in your balance.`, at: new Date(p.updated_at).toISOString(), href }
          : { id: `out:${p.reference}`, kind: "payout_processing", title: `${what} processing`, text: `${amount} from ${p.title} is on its way to ${to}`, at: new Date(p.created_at).toISOString(), href },
    );
  }
  return notices.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
