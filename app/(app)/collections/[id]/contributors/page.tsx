import { requireOrganiser } from "@/lib/server/auth";
import { appUrl } from "@/lib/server/app-url";
import { getOwnedCollection, toCollection } from "@/lib/server/collections";
import { listContributors } from "@/lib/server/contributors";
import { EmptyState } from "@/components/Card";
import { LinkButton } from "@/components/Button";
import ContributorsView from "./contributors-view";

export const metadata = { title: "Contributors · Kolekt" };

export default async function ContributorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireOrganiser();
  const row = await getOwnedCollection(me.id, decodeURIComponent(id));
  if (!row) {
    return <EmptyState icon="inbox" title="Collection not found" text="It may have been removed, or the link is incorrect."
      action={<LinkButton href="/collections" size="md">Back to Collections</LinkButton>} />;
  }
  const { contributors, summary } = await listContributors(row);
  return <ContributorsView collection={toCollection(row, await appUrl())} contributors={contributors} summary={summary} />;
}
