/**
 * Optional env for Organization JSON-LD (Google entity signals).
 *
 * - NEXT_PUBLIC_ORGANIZATION_LOGO_URL — absolute https URL, or site-relative path (e.g. /icon.svg).
 * - NEXT_PUBLIC_ORGANIZATION_SAME_AS — comma- or whitespace-separated profile URLs you control (https only).
 */
export function getOrganizationLogoAbsoluteUrl(siteOriginNoSlash: string): string {
  const custom = process.env.NEXT_PUBLIC_ORGANIZATION_LOGO_URL?.trim();
  if (custom) {
    if (/^https?:\/\//i.test(custom)) return custom.replace(/\/$/, "");
    const path = custom.startsWith("/") ? custom : `/${custom}`;
    return `${siteOriginNoSlash}${path}`;
  }
  return `${siteOriginNoSlash}/icon.svg`;
}

export function getOrganizationSameAsUrls(): string[] {
  const raw = process.env.NEXT_PUBLIC_ORGANIZATION_SAME_AS?.trim();
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((u) => /^https:\/\//i.test(u));
}
