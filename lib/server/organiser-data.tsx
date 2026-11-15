import "server-only";
import { DataProvider } from "@/lib/create-collection";
import { requireOrganiser } from "./auth";
import { appUrl } from "./app-url";
import { listCollections, organiserStats, recentActivity } from "./collections";

/** Loads the signed-in organiser's data once per request and hands it to the client screens. */
export async function OrganiserData({ children }: { children: React.ReactNode }) {
  const me = await requireOrganiser();
  const base = await appUrl();
  const [collections, stats, activity] = await Promise.all([
    listCollections(me.id, base),
    organiserStats(me.id),
    recentActivity(me.id),
  ]);
  return (
    <DataProvider
      user={{ name: me.full_name, email: me.email, phone: me.phone, photo: me.photo }}
      collections={collections}
      stats={stats}
      activity={activity}
    >
      {children}
    </DataProvider>
  );
}
