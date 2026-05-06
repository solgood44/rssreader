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
