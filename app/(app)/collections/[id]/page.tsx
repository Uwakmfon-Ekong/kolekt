import QRCode from "qrcode";
import { requireOrganiser } from "@/lib/server/auth";
import { appUrl } from "@/lib/server/app-url";
import { getOwnedCollection, listContributions } from "@/lib/server/collections";
import { balanceFor, listPayouts } from "@/lib/server/payouts";
import { memberStatus } from "@/lib/server/members";
import { listContributors } from "@/lib/server/contributors";
import CollectionView from "./collection-view";

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireOrganiser();
  const c = await getOwnedCollection(me.id, decodeURIComponent(id));
  const [contributions, balance, payouts, members, people] = c
    ? await Promise.all([
        listContributions(c.id),
        balanceFor(c.id),
        listPayouts(c.id),
        memberStatus(c.id, c.collection_type === "fixed" ? Number(c.fixed_amount) : null),
        listContributors(c),
      ])
    : [[], { collected: 0, paidOut: 0, processing: 0, available: 0 }, [], { members: [], notOnList: [] }, null];
  const qr = c
    ? await QRCode.toDataURL(`${await appUrl()}/c/${c.slug}`, { margin: 1, width: 360, color: { dark: "#241B35", light: "#FFFFFF" } })
    : null;
  return <CollectionView id={c?.id ?? id} contributions={contributions} qr={qr} balance={balance} payouts={payouts} members={members} summary={people?.summary ?? null} />;
}
