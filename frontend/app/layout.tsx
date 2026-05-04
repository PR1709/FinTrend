import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "FinTrend AI — Financial Insight Generator",
  description: "Transform financial datasets into structured trend reports with AI-powered memory.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="pt-16 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
