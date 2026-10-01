/** Platform URL settings are trusted; forwarded headers supplied by clients are not. */
export function isAllowedOrigin(requestUrl: string, origin: string | null, configured: (string | undefined)[]) {
  if (!origin) return true;
  const allowed = new Set([new URL(requestUrl).origin]);
  for (const value of configured) {
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:") allowed.add(url.origin);
    } catch { /* Invalid optional configuration grants no additional origin. */ }
  }
  return allowed.has(origin);
}
