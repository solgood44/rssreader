/**
 * Canonical origin for sitemap, robots, Open Graph, and metadataBase.
 *
 * Set `NEXT_PUBLIC_SITE_URL` in production (e.g. `https://yoursite.com`).
 * On Vercel, `VERCEL_URL` is used when unset (preview/prod hostname).
 */
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const u = explicit.endsWith("/") ? explicit : `${explicit}/`;
    return new URL(u);
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const raw = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    const u = raw.endsWith("/") ? raw : `${raw}/`;
    return new URL(u);
  }
  return new URL("http://localhost:3000/");
}
