import type { Metadata } from "next";
import { appUrl } from "@/lib/server/app-url";
import { getCollectionBySlug, isOpen, toCollection } from "@/lib/server/collections";
import { publicSupporters, rosterProgress } from "@/lib/server/members";
import ContributeForm from "./contribute-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCollectionBySlug(slug);
  if (!c) return { title: "Collection not found · Kolekt" };
  return {
    title: `${c.title} · Kolekt`,
    description: `Contribute to ${c.title}${c.organisation ? ` by ${c.organisation}` : ""}. Pay securely with Paga, no account needed.`,
  };
}

export default async function PublicCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await getCollectionBySlug(slug);
  if (!row) return <ContributeForm collection={null} progress={null} supporters={[]} />;
  const [progress, supporters] = await Promise.all([
    rosterProgress(row.id),
    row.show_public_names !== false && isOpen(row) ? publicSupporters(row.id) : Promise.resolve([]),
  ]);
  return <ContributeForm collection={toCollection(row, await appUrl())} progress={progress} supporters={supporters} />;
}
