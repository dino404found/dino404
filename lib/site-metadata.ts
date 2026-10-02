import type { Metadata } from "next";

/** Only the live custom domain is indexable; preview deploys remain shareable. */
export function publicSite(env: Record<string, string | undefined>) {
  const origin = new URL(env.APP_ORIGIN || env.URL || "https://dino404.xyz");
  if (!/^https?:$/.test(origin.protocol) || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error("APP_ORIGIN must be a public HTTP(S) origin without credentials, path, query or fragment.");
  }
  const indexable = env.CONTEXT === "production" && origin.protocol === "https:" && ["dino404.xyz", "www.dino404.xyz"].includes(origin.hostname);
  return { origin, indexable };
}

export function homeMetadata(env: Record<string, string | undefined>): Metadata {
  const { origin, indexable } = publicSite(env);
  const title = "DINO404 — Keep running.";
  const description = "Jump candles. Duck drones. Find the signal. A classic pixel runner with a fresh leaderboard every day.";
  const image = new URL("/social-card.png", origin).href;
  return {
    metadataBase: origin, title, description,
    alternates: { canonical: origin.href },
    robots: { index: indexable, follow: indexable },
    openGraph: { type: "website", siteName: "DINO404", locale: "en_US", url: origin.href, title, description, images: [{ url: image, width: 1200, height: 630, alt: "DINO404 — Run to reconnect. Jump candles, duck drones, chase your daily best." }] },
    twitter: { card: "summary_large_image", title, description, images: [{ url: image, alt: "DINO404 — Run to reconnect." }] },
  };
}
