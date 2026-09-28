import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DINO404 — Keep running.",
  description:
    "Jump the candles. Chase your daily best. A classic pixel runner with a new green world and a daily leaderboard.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
