import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kolekt: run contribution rounds and see who has paid",
  description:
    "Kolekt is a payment collection and tracking platform for churches, offices, schools, student associations and any group that collects contributions. One link, automatic PAID status, one dashboard.",
  openGraph: {
    title: "Kolekt: run contribution rounds and see who has paid",
    description:
      "Create a collection for any contribution round, share one link, and track every payment without chasing screenshots.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#7743DB" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
