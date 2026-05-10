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

/** Strip known host promos prepended to RSS/channel descriptions (e.g. AdFreeBooks). */
export function sanitizeShowDescription(description: string): string {
  let s = description.trim();
  const adfreePrefix =
    /^\s*https?:\/\/(?:www\.)?adfreebooks\.com\s*[-–—]\s*500\s*\+?\s*audiobooks?,?\s*all\s*ad\s*free\.?\s*/i;
  while (adfreePrefix.test(s)) {
    s = s.replace(adfreePrefix, "").trim();
  }
  /* Trailing “visit our site” plugs (real synopsis often appears before this). */
  s = s
    .replace(
      /\s*View our entire collection of podcasts?\s+at\s+(?:https?:\/\/)?(?:www\.)?solgood\.org\.?\s*/gi,
      " ",
    )
    .trim();
  s = s.replace(/\s+at\s+(?:https?:\/\/)?(?:www\.)?solgood\.org\.?\s*/gi, " ").trim();
  s = s.replace(/\s+All Librivox recordings[\s\S]*$/i, "").trim();
  return s;
}

/** Lowercase, strip punctuation for comparing description to title. */
function normalizeForShowTextCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/\u2026/g, " ")
    .replace(/[\s\-—–]+/g, " ")
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .trim();
}

/** Strip trailing ellipsis from importer-truncated RSS blurbs (… or ...). */
export function stripTrailingSummaryEllipsis(s: string): string {
  return s.replace(/\s*(\.{3,}|…)\s*$/u, "").trim();
}

/**
 * Imported show files often repeat the RSS blurb in both YAML `description` and markdown body.
 * When both are the same intro (after promo strip), show the hero line only.
 */
export function isMarkdownBodyRedundantWithDescription(
  sanitizedBody: string,
  sanitizedDescription: string,
): boolean {
  const b = sanitizedBody.trim();
  const d = sanitizedDescription.trim();
  if (!b || !d) return false;
  const nb = normalizeForShowTextCompare(b);
  const nd = normalizeForShowTextCompare(d);
  if (nb === nd) return true;
  if (nd.length >= 50 && nb.startsWith(nd)) {
    const rest = nb.slice(nd.length).trim();
    if (rest.length <= Math.max(40, Math.floor(nd.length * 0.12))) return true;
  }
  if (nb.length >= 50 && nd.startsWith(nb)) {
    const rest = nd.slice(nb.length).trim();
    if (rest.length <= Math.max(40, Math.floor(nb.length * 0.12))) return true;
  }
  const dStrip = stripTrailingSummaryEllipsis(d);
  const bStrip = stripTrailingSummaryEllipsis(b);
  if (dStrip.length >= 32 && bStrip.startsWith(dStrip)) return true;
  if (bStrip.length >= 32 && dStrip.startsWith(bStrip)) return true;
  return false;
}

export type ShowPageTeaser = { heroParagraph: string; markdownBody: string };

/**
 * Pick hero vs markdown body so we do not show the same truncated RSS blurb twice.
 * When the body continues past a truncated YAML description, prefer the body only.
 */
export function resolveShowPageTeaser(
  sanitizedDescription: string,
  sanitizedBody: string,
  title: string,
): ShowPageTeaser {
  const desc = sanitizedDescription.trim();
  const body = sanitizedBody.trim();
  const descPass = Boolean(desc) && shouldShowShowDescription(desc, title);
  const bodyPass = Boolean(body) && shouldShowShowDescription(body, title);

  if (!body) {
    return { heroParagraph: descPass ? desc : "", markdownBody: "" };
  }
  if (!descPass) {
    return { heroParagraph: "", markdownBody: bodyPass ? body : "" };
  }

  const redundant = isMarkdownBodyRedundantWithDescription(body, desc);
  const descStrip = stripTrailingSummaryEllipsis(desc);
  const bodyExtendsDesc =
    body.startsWith(desc) ||
    (descStrip.length >= 32 && body.startsWith(descStrip)) ||
    (() => {
      const nb = normalizeForShowTextCompare(body);
      const nd = normalizeForShowTextCompare(descStrip);
      const prefixLen = Math.min(200, nd.length);
      return prefixLen >= 32 && nb.startsWith(nd.slice(0, prefixLen));
    })();

  if (bodyExtendsDesc && body.length > desc.length) {
    if (bodyPass) return { heroParagraph: "", markdownBody: body };
    return { heroParagraph: desc, markdownBody: "" };
  }
  if (redundant) {
    if (body.length > desc.length && bodyPass) {
      return { heroParagraph: "", markdownBody: body };
    }
    return { heroParagraph: desc, markdownBody: "" };
  }

  return { heroParagraph: desc, markdownBody: bodyPass ? body : "" };
}

/**
 * Whether a show description is worth showing on cards and the show hero.
 * Drops duplicate-of-title text, anything containing a URL, and common host-network blurbs.
 */
export function shouldShowShowDescription(description: string, title: string): boolean {
  const desc = sanitizeShowDescription(description).trim();
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
    description: sanitizeShowDescription((s.data.description ?? "").trim()),
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
