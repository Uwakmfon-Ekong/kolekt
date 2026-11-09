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
  url?: string;
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
};

export const user = { name: "Adaeze", email: "adaeze@example.com" };

export const stats = { totalCollected: 245000, growth: 12 };

export const collections: Collection[] = [
  {
    id: "church-building-fund", name: "Church Building Fund", icon: "church", collected: 335000, target: 500000,
    status: "Active", due: "Due in 5 days", note: "Due in 5 days", organisation: "RCCG Uyo",
    description: "Let’s build a better place of worship together. Every contribution counts!",
    contribution: "Fixed · ₦5,000 per person", url: "kolekt.app/c/church-building-fund",
  },
  {
    id: "departmental-dues", name: "Departmental Dues", icon: "school", collected: 282000, target: 300000,
    status: "Active", due: "Due in 12 days", note: "On track", organisation: "Computer Science Department",
    description: "Annual departmental dues for the 2026/2027 academic session.",
    contribution: "Fixed · ₦10,000 per person", url: "kolekt.app/c/departmental-dues",
  },
  {
    id: "community-outreach", name: "Community Outreach", icon: "heart", collected: 84000, target: 200000,
    status: "Active", due: "Due in 20 days", organisation: "Uyo Youth Network",
    description: "Funding food and supplies for our quarterly community outreach.",
    contribution: "Flexible · give what you can", url: "kolekt.app/c/community-outreach",
  },
];

export const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
export const percent = (c: Collection) => (c.target ? Math.round((c.collected / c.target) * 100) : 0);
