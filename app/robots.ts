import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Crawlers must read the page to see its noindex metadata and share artwork.
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/owner-login"] } };
}
