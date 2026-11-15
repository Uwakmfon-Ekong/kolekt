import type { Metadata } from "next";
import { appUrl } from "@/lib/server/app-url";
import { getCollectionBySlug, toCollection } from "@/lib/server/collections";
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
  return <ContributeForm collection={row ? toCollection(row, await appUrl()) : null} />;
}
