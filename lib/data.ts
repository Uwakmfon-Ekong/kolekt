/** Shapes the organiser screens work with. The server builds them from the database (lib/server/collections.ts). */

export type Collection = {
  id: string;
  name: string;
  icon: "church" | "school" | "heart" | "wallet";
  collected: number;
  target: number;
  status: "Active" | "Completed";
  due: string;
  note?: string;
  organisation?: string;
  description?: string;
  contribution?: string;
  /** Public link without the protocol, for display: kolekt.app/c/dues-2026-x7k2p */
  url?: string;
  /** Full public link, for copying and sharing. */
  link?: string;
  slug?: string;
  image?: string | null;
  organiserName?: string;
  contributionType?: "fixed" | "flexible";
  contributionAmount?: number;
  minimumContribution?: number;
  deadline?: string;
  allowAboveTarget?: boolean;
  contributorFields?: string[];
  collectionId?: string;
  publicationStatus?: "ACTIVE" | "CLOSED";
  contributors?: number;
  createdAt?: string;
};

export type Contribution = {
  reference: string;
  name: string;
  amount: number;
  paidAt: string;
  method: string;
  details: Record<string, string>;
  flagged: boolean;
};

export type Activity = { id: string; text: string; at: string };

export type PayoutAccount = { bankName: string; accountNumber: string; accountName: string };
export type AppUser = { name: string; email: string; phone?: string | null; photo?: string | null; payout?: PayoutAccount | null };

export type PayoutView = {
  reference: string;
  amount: number;
  fee: number;
  status: "processing" | "successful" | "failed";
  bankName: string;
  accountNumber: string;
  accountName: string;
  message: string | null;
  createdAt: string;
};

export type Balance = { collected: number; paidOut: number; processing: number; available: number };

/** 0123456789 -> ••••••6789 */
export const maskAccount = (n: string) => "••••••" + n.slice(-4);

export type Stats = { totalCollected: number; thisWeek: number; contributions: number; paidOut: number };

export const naira = (n: number) => "₦" + Number(n || 0).toLocaleString("en-NG");
export const percent = (c: Collection) => (c.target ? Math.round((c.collected / c.target) * 100) : 0);

/** "2 hours ago", "Yesterday", "3 Nov". */
export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hour${Math.floor(s / 3600) === 1 ? "" : "s"} ago`;
  if (s < 172800) return "Yesterday";
  if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}
