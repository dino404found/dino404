/** Owner-only preview access. The configured value is a hash of a random secret. */
export async function verifyOwnerCredentials(authorization: string | null, expectedHash: string | undefined) {
  if (!expectedHash || !/^[a-f0-9]{64}$/i.test(expectedHash) || !authorization?.startsWith("Basic ") || authorization.length > 2048) return false;
  let credentials: string;
  try { credentials = atob(authorization.slice(6)); } catch { return false; }
  const separator = credentials.indexOf(":");
  if (separator < 0 || credentials.slice(0, separator) !== "dino404found") return false;
  const password = credentials.slice(separator + 1);
  if (password.length < 32 || password.length > 256) return false;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password)));
  let mismatch = 0;
  for (let i = 0; i < digest.length; i++) mismatch |= digest[i] ^ parseInt(expectedHash.slice(i * 2, i * 2 + 2), 16);
  return mismatch === 0;
}
