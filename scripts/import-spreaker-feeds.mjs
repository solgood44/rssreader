#!/usr/bin/env node
/**
 * Fetch Spreaker RSS feeds and add missing content/shows/*.md entries.
 * Skips shows whose rss_url already exists in any show file.
 *
 * Usage: node scripts/import-spreaker-feeds.mjs [path/to/urls.txt]
 * Default url file: scripts/spreaker-feed-urls.txt (one feed URL per line)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");
const SHOWS_DIR = path.join(APP_ROOT, "content", "shows");

const BATCH = 5;
const FETCH_TIMEOUT_MS = 20_000;

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function innerText(raw) {
  const cdata = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
  const body = cdata ? cdata[1] : raw;
  return decodeEntities(stripTags(body));
}

function tagContent(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function attr(block, name) {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function parseChannel(xml) {
  const channel = xml.match(/<channel[^>]*>([\s\S]*?)<\/channel>/i)?.[1] ?? xml;
  let title = innerText(tagContent(channel, "title")) || "Untitled show";
  if (title.includes("\n")) title = title.split(/\n/)[0].trim();
  let description =
    innerText(tagContent(channel, "description")) ||
    innerText(tagContent(channel, "itunes:summary")) ||
    "";
  const itunesImgTag = channel.match(/<itunes:image[^>]*>/i)?.[0] ?? "";
  let cover = attr(itunesImgTag, "href");
  if (!cover) {
    const firstItem = channel.split(/<item[^>]*>/i)[1]?.split(/<\/item>/i)[0];
    if (firstItem) {
      const itemImg = firstItem.match(/<itunes:image[^>]*>/i)?.[0] ?? "";
      cover = attr(itemImg, "href");
    }
  }
  return { title, description, cover };
}

function slugifyTitle(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "show";
}

function yamlEscape(s) {
  return String(s).replace(/'/g, "''");
}

function truncate(s, max) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

function showIdFromFeedUrl(url) {
  const m = url.match(/show\/(\d+)\//);
  return m ? m[1] : null;
}

function rssAlreadyExists(showId) {
  if (!fs.existsSync(SHOWS_DIR)) return false;
  const needle = `show/${showId}/episodes/feed`;
  for (const f of fs.readdirSync(SHOWS_DIR)) {
    if (!f.endsWith(".md")) continue;
    const raw = fs.readFileSync(path.join(SHOWS_DIR, f), "utf8");
    if (raw.includes(needle)) return true;
  }
  return false;
}

function uniqueSlug(baseSlug) {
  let slug = baseSlug;
  let n = 0;
  while (fs.existsSync(path.join(SHOWS_DIR, `${slug}.md`))) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
  return slug;
}

function writeShowMd({ slug, title, description, cover, rssUrl }) {
  const descFront = truncate(description, 420);
  const bodyExcerpt = truncate(description, 500);
  const coverLine = cover ? `cover_image: '${yamlEscape(cover)}'` : "";
  const lines = [
    "---",
    `title: '${yamlEscape(title)}'`,
    "template: show",
    `description: '${yamlEscape(descFront)}'`,
    ...(coverLine ? [coverLine] : []),
    `rss_url: '${yamlEscape(rssUrl)}'`,
    "taxonomy:",
    "  category: ['Daily', 'Arts', 'Books']",
    "---",
    "",
    bodyExcerpt ? `${bodyExcerpt}\n` : "",
  ];
  fs.writeFileSync(path.join(SHOWS_DIR, `${slug}.md`), lines.join("\n"), "utf8");
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/rss+xml, application/xml, text/xml, */*" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function processUrl(rssUrl) {
  const showId = showIdFromFeedUrl(rssUrl);
  if (!showId) {
    console.warn("Skip bad URL:", rssUrl);
    return "bad";
  }
  if (rssAlreadyExists(showId)) {
    console.log("Skip existing:", showId);
    return "skip";
  }
  const xml = await fetchText(rssUrl);
  const { title, description, cover } = parseChannel(xml);
  const baseSlug = `${slugifyTitle(title)}-${showId}`;
  const slug = uniqueSlug(baseSlug);
  writeShowMd({ slug, title, description, cover, rssUrl });
  console.log("Added:", slug, title.slice(0, 50));
  return "add";
}

async function main() {
  const urlFile = path.resolve(process.argv[2] ?? path.join(__dirname, "spreaker-feed-urls.txt"));
  if (!fs.existsSync(urlFile)) {
    console.error("Missing URL file:", urlFile);
    process.exit(1);
  }
  const raw = fs.readFileSync(urlFile, "utf8");
  const urls = [
    ...new Set(
      raw
        .split(/\n/)
        .map((l) => l.trim())
        .filter((l) => l.startsWith("http")),
    ),
  ];
  console.log("Unique feed URLs:", urls.length);

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < urls.length; i += BATCH) {
    const chunk = urls.slice(i, i + BATCH);
    const results = await Promise.all(
      chunk.map(async (u) => {
        try {
          return await processUrl(u);
        } catch (e) {
          console.error("FAIL", u, e instanceof Error ? e.message : e);
          return "fail";
        }
      }),
    );
    for (const r of results) {
      if (r === "add") added += 1;
      else if (r === "skip") skipped += 1;
      else if (r === "fail") failed += 1;
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log("\nDone. added:", added, "skipped:", skipped, "failed:", failed);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
