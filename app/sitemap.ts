import type { MetadataRoute } from "next";
import { getAllBlogPosts, getAllCategories, getAllShows } from "@/lib/content";
import { getAllAuthors } from "@/lib/authors";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const { origin } = getSiteUrl();
  const now = new Date();

  const staticPaths = ["", "/shows", "/blog", "/category", "/author", "/radio-shows", "/recent", "/favorites"] as const;

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${origin}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.85,
  }));

  const shows = getAllShows().map((s) => ({
    url: `${origin}/shows/${s.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  const categories = getAllCategories().map((c) => ({
    url: `${origin}/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.72,
  }));

  const posts = getAllBlogPosts().map((p) => ({
    url: `${origin}/blog/${p.slug}`,
    lastModified: p.data.date ? new Date(p.data.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  const authors = getAllAuthors().map((a) => ({
    url: `${origin}/author/${a.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.68,
  }));

  return [...staticEntries, ...shows, ...categories, ...authors, ...posts];
}
