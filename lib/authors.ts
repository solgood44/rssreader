import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { contentPath, getAllShows, type ShowRecord } from "./content";
import { showsToListEntries, type ShowListEntry } from "./show-search";

export type AuthorRecord = {
  slug: string;
  name: string;
  blurb: string;
  showSlugs: string[];
};

function slugifyAuthor(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleAuthorCandidates(title: string): string[] {
  const out: string[] = [];

  // "Northanger Abbey by Jane Austen"
  const by = title.match(/\bby\s+([A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){1,3})\b/);
  if (by?.[1]) out.push(by[1].trim());

  // "The Time Machine - H.G. Wells" (dash variants)
  const dash = title.match(/\s[-—–]\s*([A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){1,3})\s*$/);
  if (dash?.[1]) out.push(dash[1].trim());

  // Trailing parenthetical "(Jane Austen)"
  const paren = title.match(/\(([^)]+)\)\s*$/);
  if (paren?.[1]) out.push(paren[1].trim());

  return Array.from(new Set(out));
}

function looksLikeHumanName(name: string): boolean {
  const n = name.trim();
  if (!n) return false;
  if (n.length < 5 || n.length > 48) return false;
  if (/[0-9]/.test(n)) return false;
  if (/[\/\\@#:$]/.test(n)) return false;
  if (!/\s/.test(n)) return false; // require at least 2 words

  // Reject common non-person phrases
  const lower = n.toLowerCase();
  const banned = [
    "collection",
    "audiobook",
    "full audiobook",
    "full play",
    "podcast",
    "daily",
    "stories",
    "sounds",
    "radio",
    "sleep",
    "meditation",
    "sol good",
  ];
  if (banned.some((b) => lower.includes(b))) return false;

  // Token checks: allow initials like "H.G." and particles like "de"
  const tokens = n.split(/\s+/).filter(Boolean);
  if (tokens.length < 2 || tokens.length > 5) return false;

  for (const t of tokens) {
    if (/^(de|da|del|van|von|la|le|of|the)$/i.test(t)) continue;
    if (/^[A-Z](?:\.[A-Z])+\.$/.test(t)) continue; // H.G.
    if (!/^[A-Z][A-Za-z.'-]*$/.test(t)) return false;
  }
  return true;
}

function readAuthorBlurbs(): Map<string, { name?: string; blurb?: string }> {
  const dir = contentPath("authors");
  if (!fs.existsSync(dir)) return new Map();

  const out = new Map<string, { name?: string; blurb?: string }>();
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!d.isFile() || !d.name.endsWith(".md")) continue;
    const slug = d.name.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(dir, d.name), "utf8");
    const parsed = matter(raw);
    const data = parsed.data as { name?: string; blurb?: string };
    const blurb = (data.blurb ?? parsed.content ?? "").toString().trim();
    out.set(slug, { name: data.name, blurb });
  }
  return out;
}

export function getAllAuthors(): AuthorRecord[] {
  const shows = getAllShows();
  const blurbBySlug = readAuthorBlurbs();

  const map = new Map<string, { name: string; showSlugs: string[] }>();
  for (const s of shows) {
    for (const cand of titleAuthorCandidates(s.data.title)) {
      if (!looksLikeHumanName(cand)) continue;
      const slug = slugifyAuthor(cand);
      if (!slug) continue;
      const prev = map.get(slug);
      if (!prev) map.set(slug, { name: cand, showSlugs: [s.slug] });
      else prev.showSlugs.push(s.slug);
    }
  }

  const authors: AuthorRecord[] = [];
  for (const [slug, v] of map.entries()) {
    const meta = blurbBySlug.get(slug);
    const name = meta?.name?.trim() || v.name;
    const blurb =
      meta?.blurb?.trim() ||
      `Listen to podcasts and audiobooks by ${name} in the Podcast library.`;
    authors.push({
      slug,
      name,
      blurb,
      showSlugs: Array.from(new Set(v.showSlugs)),
    });
  }

  authors.sort((a, b) => {
    const dc = b.showSlugs.length - a.showSlugs.length;
    if (dc !== 0) return dc;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
  return authors;
}

export function getAuthor(slug: string): (AuthorRecord & { shows: ShowListEntry[] }) | null {
  const author = getAllAuthors().find((a) => a.slug === slug);
  if (!author) return null;
  const allShows = getAllShows();
  const showSet = new Set(author.showSlugs);
  const records: ShowRecord[] = allShows.filter((s) => showSet.has(s.slug));
  const shows = showsToListEntries(records).sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
  );
  return { ...author, shows };
}

