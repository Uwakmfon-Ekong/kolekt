import { OrganiserData } from "@/lib/server/organiser-data";

export const dynamic = "force-dynamic";

export default function FlowLayout({ children }: { children: React.ReactNode }) {
  return <OrganiserData>{children}</OrganiserData>;
}
