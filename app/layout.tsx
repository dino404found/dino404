import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DINO404 — Keep running.",
  description:
    "Jump the candles. Chase your daily best. A classic pixel runner with a new green world and a daily leaderboard.",
  icons: {
    icon: [
      { url: "/favicon.svg?v=dino-2", type: "image/svg+xml", sizes: "any" },
      { url: "/icon-32.png?v=dino-2", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico?v=dino-2",
    apple: { url: "/apple-touch-icon.png?v=dino-2", sizes: "180x180" },
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
