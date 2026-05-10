import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();

export function contentPath(...segments: string[]) {
  return path.join(ROOT, "content", ...segments);
}

export type ShowFrontmatter = {
  title: string;
  description?: string;
  cover_image?: string;
  rss_url?: string;
  taxonomy?: { category?: string[] };
  apple_podcasts_url?: string;
  spotify_url?: string;
};

export type ShowRecord = {
  slug: string;
  data: ShowFrontmatter;
  body: string;
};

export type BlogFrontmatter = {
  title: string;
  date?: string;
  summary?: string;
  metadata?: { description?: string; ["og:image"]?: string };
  header?: { hero_image?: string; hero_image_alt?: string };
  taxonomy?: { tag?: string[]; category?: string };
  routes?: { default?: string };
};

export type BlogRecord = {
  slug: string;
  data: BlogFrontmatter;
  body: string;
};

export type CategoryFrontmatter = {
  title: string;
  category_match?: string;
  category_rss_allowlist?: string[];
};

function readMdDir(dir: string): { slug: string; raw: string }[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".md"))
    .map((d) => ({
      slug: d.name.replace(/\.md$/, ""),
      raw: fs.readFileSync(path.join(dir, d.name), "utf8"),
    }));
}

export function getAllShows(): ShowRecord[] {
  const dir = contentPath("shows");
  return readMdDir(dir).map(({ slug, raw }) => {
    const { data, content } = matter(raw);
    return { slug, data: data as ShowFrontmatter, body: content.trim() };
  });
}

export function getShow(slug: string): ShowRecord | null {
  const file = contentPath("shows", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  return { slug, data: data as ShowFrontmatter, body: content.trim() };
}

export function getAllBlogPosts(): BlogRecord[] {
  const dir = contentPath("blog");
  return readMdDir(dir).map(({ slug, raw }) => {
    const { data, content } = matter(raw);
    return { slug, data: data as BlogFrontmatter, body: content.trim() };
  });
}

export function getBlogPost(slug: string): BlogRecord | null {
  const file = contentPath("blog", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  return { slug, data: data as BlogFrontmatter, body: content.trim() };
}

export function getAllCategories(): { slug: string; data: CategoryFrontmatter; body: string }[] {
  const dir = contentPath("categories");
  return readMdDir(dir).map(({ slug, raw }) => {
    const { data, content } = matter(raw);
    return { slug, data: data as CategoryFrontmatter, body: content.trim() };
  });
}

export function getCategory(slug: string) {
  const file = contentPath("categories", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  return { slug, data: data as CategoryFrontmatter, body: content.trim() };
}

/** Blog slug as in Grav `routes.default` when present. */
export function blogCanonicalSlug(post: BlogRecord): string {
  const r = post.data.routes?.default;
  if (r) return r.replace(/^\//, "").replace(/\/$/, "") || post.slug;
  return post.slug;
}

export function normalizeRssUrl(url: string): string {
  const u = url.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(u);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/+$/, "");
  } catch {
    return u;
  }
}

export function showsForCategory(match: string): ShowRecord[] {
  const m = match.toLowerCase();
  return getAllShows().filter((s) =>
    (s.data.taxonomy?.category ?? []).some((c) => c.toLowerCase() === m),
  );
}

/** Resolve shows for a category from an in-memory list (single catalog read). */
export function showsForCategoryConfigFromRecords(
  shows: ShowRecord[],
  data: CategoryFrontmatter,
): ShowRecord[] {
  const allow = data.category_rss_allowlist;
  if (allow && allow.length > 0) {
    const set = new Set(allow.map(normalizeRssUrl));
    return shows.filter((s) => s.data.rss_url && set.has(normalizeRssUrl(s.data.rss_url)));
  }
  if (data.category_match) {
    const m = data.category_match.toLowerCase();
    return shows.filter((s) =>
      (s.data.taxonomy?.category ?? []).some((c) => c.toLowerCase() === m),
    );
  }
  return [];
}

/** Resolve shows for a category page: optional RSS allowlist overrides taxonomy match. */
export function showsForCategoryConfig(data: CategoryFrontmatter): ShowRecord[] {
  return showsForCategoryConfigFromRecords(getAllShows(), data);
}

/** Nav drawer rows with show counts (one `getAllShows` pass). */
export function getCategoryNavRows(): { slug: string; title: string; count: number }[] {
  const all = getAllShows();
  const rows = getAllCategories().map((c) => ({
    slug: c.slug,
    title: c.data.title || c.slug,
    count: showsForCategoryConfigFromRecords(all, c.data).length,
  }));
  rows.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  const dailyIdx = rows.findIndex((c) => c.slug === "daily");
  if (dailyIdx > 0) {
    const [daily] = rows.splice(dailyIdx, 1);
    rows.unshift(daily);
  }
  return rows;
}

/** Preserve editorial order from an RSS allowlist (e.g. Daily category). */
export function orderShowsByRssAllowlist(shows: ShowRecord[], allow: string[]): ShowRecord[] {
  const keys = allow.map(normalizeRssUrl);
  const map = new Map<string, ShowRecord>();
  for (const s of shows) {
    if (s.data.rss_url) map.set(normalizeRssUrl(s.data.rss_url), s);
  }
  const out: ShowRecord[] = [];
  for (const k of keys) {
    const s = map.get(k);
    if (s) out.push(s);
  }
  return out;
}
