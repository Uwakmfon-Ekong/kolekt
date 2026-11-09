import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppProvider } from "@/lib/create-collection";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = { title: "Kolekt", description: "Collect. Track. Stay Transparent." };
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#FFFBF5" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans">
        {/* Single frontend-only store: user, collections and the create-collection draft survive every navigation. */}
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
