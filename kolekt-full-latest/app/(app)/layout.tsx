import AppShell from "@/components/AppShell";
import { OrganiserData } from "@/lib/server/organiser-data";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganiserData>
      <AppShell>{children}</AppShell>
    </OrganiserData>
  );
}
