/**
 * Favorite shows (by slug), device-local — same idea as listen progress.
 */

export const FAVORITES_STORAGE_KEY = "rssreader_favorite_shows_v1";

export const FAVORITES_UPDATED_EVENT = "favorite-shows-updated";

export function getFavoriteSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function isFavoriteSlug(slug: string): boolean {
  if (!slug) return false;
  return getFavoriteSlugs().includes(slug);
}

function persist(slugs: string[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(slugs));
    window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
  } catch {
    /* quota / private mode */
  }
}

/** Replace order (e.g. after drag-and-drop). Dedupes, keeps first occurrence. */
export function setFavoriteSlugs(order: string[]): void {
  if (typeof window === "undefined") return;
  const seen = new Set<string>();
  const next: string[] = [];
  for (const s of order) {
    if (typeof s === "string" && s && !seen.has(s)) {
      seen.add(s);
      next.push(s);
    }
  }
  persist(next);
}

/** Most recently hearted first. */
export function addFavoriteSlug(slug: string): void {
  if (!slug || typeof window === "undefined") return;
  const next = getFavoriteSlugs().filter((s) => s !== slug);
  next.unshift(slug);
  persist(next);
}

export function removeFavoriteSlug(slug: string): void {
  if (!slug || typeof window === "undefined") return;
  persist(getFavoriteSlugs().filter((s) => s !== slug));
}

/** @returns true if now favorited */
export function toggleFavoriteSlug(slug: string): boolean {
  if (!slug || typeof window === "undefined") return false;
  if (isFavoriteSlug(slug)) {
    removeFavoriteSlug(slug);
    return false;
  }
  addFavoriteSlug(slug);
  return true;
}
