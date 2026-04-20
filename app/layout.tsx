import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "BuildingWatch — NYC Housing Data",
  description: "Look up HPD violations and complaints for any NYC address",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.className} h-full`}>
      <body className="min-h-full" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        {children}
      </body>
    </html>
  );
}
