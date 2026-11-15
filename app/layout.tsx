import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppProvider } from "@/lib/create-collection";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: { default: "Kolekt · Group payments, minus the wahala", template: "%s" },
  description: "Collect dues, levies and contributions with one link. Every payment is verified with Paga and matched to the right person. No screenshots, no spreadsheets.",
  applicationName: "Kolekt",
  openGraph: {
    title: "Kolekt · Group payments, minus the wahala",
    description: "One link to collect. Every payment verified with Paga. Live tracking for organisers.",
    siteName: "Kolekt",
    type: "website",
  },
};
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#FFFBF5" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans">
        {/* The create-collection draft lives in the browser; organiser data comes from the server (lib/server). */}
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
