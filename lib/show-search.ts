import type { ShowRecord } from "./content";

/** Lightweight show row for directory search/sort (no full markdown body). */

export type ShowListEntry = {
  slug: string;
  title: string;
  description: string;
  categories: string[];
  cover_image?: string;
};

export type SortMode = "az" | "za" | "random";

/** Lowercase, strip punctuation for comparing description to title. */
function normalizeForShowTextCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/[\s\-—–]+/g, " ")
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .trim();
}

/**
 * Whether a show description is worth showing on cards and the show hero.
 * Drops duplicate-of-title text, anything containing a URL, and common host-network blurbs.
 */
export function shouldShowShowDescription(description: string, title: string): boolean {
  const desc = description.trim();
  if (!desc) return false;
  if (normalizeForShowTextCompare(desc) === normalizeForShowTextCompare(title)) return false;
  if (/https?:\/\/|\bwww\./i.test(desc)) return false;

  const low = desc.toLowerCase();
  if (low.includes("solgoodmedia.com")) return false;
  if (low.includes("listen to hundreds of audiobooks")) return false;
  if (low.includes("thousands of short stories")) return false;
  if (low.includes("thousands of short audio")) return false;

  return true;
}

function normalizeCategories(raw: ShowRecord["data"]["taxonomy"]): string[] {
  const c = raw?.category;
  if (!c) return [];
  return Array.isArray(c) ? c : [String(c)];
}

export function showsToListEntries(shows: ShowRecord[]): ShowListEntry[] {
  return shows.map((s) => ({
    slug: s.slug,
    title: s.data.title,
    description: (s.data.description ?? "").trim(),
    categories: normalizeCategories(s.data.taxonomy),
    cover_image: s.data.cover_image,
  }));
}

function normalize(q: string): string {
  return q.toLowerCase().trim();
}

/** Substring match on title, description, slug (as words), and categories. */
export function matchesShow(entry: ShowListEntry, q: string): boolean {
  const n = normalize(q);
  if (!n) return true;
  const blob = [
    entry.title,
    entry.description,
    entry.slug.replace(/-/g, " "),
    ...entry.categories,
  ]
    .join(" ")
    .toLowerCase();
  return blob.includes(n);
}

export function filterShows(entries: ShowListEntry[], q: string): ShowListEntry[] {
  if (!normalize(q)) return entries;
  return entries.filter((e) => matchesShow(e, q));
}

function seededUnit(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function shuffleEntries(entries: ShowListEntry[], seed: number): ShowListEntry[] {
  const out = [...entries];
  const rnd = seededUnit(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/** YYYYMMDD in UTC — stable for a calendar day for rotating recommendations. */
function utcDayStamp(): number {
  const d = new Date();
  return d.getUTCFullYear() * 10_000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

/**
 * Podcasts similar to the current show (shared taxonomy categories first), then the rest.
 * Order shuffles with a seed derived from slug + UTC day so the set rotates daily.
 */
export function recommendedShowEntries(
  currentSlug: string,
  entries: ShowListEntry[],
  limit: number,
): ShowListEntry[] {
  const pool = entries.filter((e) => e.slug !== currentSlug);
  const current = entries.find((e) => e.slug === currentSlug);
  const cats = new Set(
    (current?.categories ?? []).map((c) => c.toLowerCase().trim()).filter(Boolean),
  );

  const same: ShowListEntry[] = [];
  const other: ShowListEntry[] = [];
  for (const e of pool) {
    const overlap = e.categories.some((c) => cats.has(c.toLowerCase().trim()));
    if (cats.size > 0 && overlap) same.push(e);
    else other.push(e);
  }

  const day = utcDayStamp();
  const seed = hashString(currentSlug) ^ day ^ 0xbeefcafe;
  const seed2 = seed ^ 0xdeadbeef;

  const shuffledSame = shuffleEntries(same, seed);
  const shuffledOther = shuffleEntries(other, seed2);

  const out: ShowListEntry[] = [];
  for (const e of shuffledSame) {
    if (out.length >= limit) break;
    out.push(e);
  }
  for (const e of shuffledOther) {
    if (out.length >= limit) break;
    out.push(e);
  }
  return out;
}

export function sortEntries(
  entries: ShowListEntry[],
  mode: SortMode,
  randomSeed: number,
): ShowListEntry[] {
  if (mode === "random") return shuffleEntries(entries, randomSeed);
  const copy = [...entries];
  copy.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
  );
  if (mode === "za") copy.reverse();
  return copy;
}

/** Autocomplete: prefer titles that start with the query, then alphabetical. */
export function suggestionShows(
  entries: ShowListEntry[],
  q: string,
  limit = 10,
): ShowListEntry[] {
  const n = normalize(q);
  if (!n) return [];
  const filtered = entries.filter((e) => matchesShow(e, q));
  filtered.sort((a, b) => {
    const al = a.title.toLowerCase();
    const bl = b.title.toLowerCase();
    const as = al.startsWith(n) ? 0 : 1;
    const bs = bl.startsWith(n) ? 0 : 1;
    if (as !== bs) return as - bs;
    const ai = al.indexOf(n);
    const bi = bl.indexOf(n);
    if (ai !== bi) return ai - bi;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
  return filtered.slice(0, limit);
}
