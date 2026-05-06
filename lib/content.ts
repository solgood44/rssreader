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

export function getHomepageMarkdown(): { body: string } | null {
  const file = contentPath("pages", "home.md");
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { content } = matter(raw);
  return { body: content.trim() };
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

export function showsForCategory(match: string): ShowRecord[] {
  const m = match.toLowerCase();
  return getAllShows().filter((s) =>
    (s.data.taxonomy?.category ?? []).some((c) => c.toLowerCase() === m),
  );
}
