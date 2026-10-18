import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FB Group Posting Dashboard",
  description: "Campaign status, decisions and activity log for the Facebook group posting tool.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
