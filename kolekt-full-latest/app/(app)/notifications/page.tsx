import { requireOrganiser } from "@/lib/server/auth";
import { listNotices } from "@/lib/server/notifications";
import NotificationsView from "./notifications-view";

export const metadata = { title: "Notifications · Kolekt" };

export default async function NotificationsPage() {
  const me = await requireOrganiser();
  return <NotificationsView notices={await listNotices(me.id, 100)} />;
}
