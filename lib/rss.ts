/**
 * Fetch and parse podcast RSS (Spreaker-compatible RSS 2.0).
 * Audio URLs stay external — we only pass them to <audio src> or the browser.
 */

export type RssEpisode = {
  /** Stable id for URLs (derived from Spreaker episode path or guid). */
  id: string;
  title: string;
  audioUrl: string | null;
  image: string | null;
  description: string;
  link: string;
  guid: string;
  pubDate: string | null;
  /** Raw duration string if present (e.g. HH:MM:SS from itunes:duration). */
  duration: string | null;
};

const RSS_CACHE_SECONDS = Number(process.env.RSS_REVALIDATE_SECONDS ?? 3600);

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function innerText(raw: string): string {
  const cdata = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
  const body = cdata ? cdata[1] : raw;
  return decodeEntities(stripTags(body));
}

function firstMatch(xml: string, re: RegExp): string {
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

/** Pull first <tag>...</tag> body (non-greedy), case-insensitive. */
function tagContent(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  return firstMatch(block, re);
}

function attr(block: string, name: string): string {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  return firstMatch(block, re);
}

export function episodeIdFromRssItem(itemXml: string): string {
  const link = tagContent(itemXml, "link");
  const sp = link.match(/spreaker\.com\/episode\/([^/?#]+)/i);
  if (sp?.[1]) return sp[1];
  const guid = innerText(tagContent(itemXml, "guid")) || innerText(tagContent(itemXml, "link"));
  const cleaned = guid.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "episode";
}

export function parseRssItems(xml: string): RssEpisode[] {
  const channel = xml.match(/<channel[^>]*>([\s\S]*?)<\/channel>/i)?.[1] ?? xml;
  const chunks = channel.split(/<item[^>]*>/i).slice(1);
  const out: RssEpisode[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const itemXml = chunk.split(/<\/item>/i)[0];
    if (!itemXml) continue;

    const title = innerText(tagContent(itemXml, "title")) || "Untitled";
    const encTag = itemXml.match(/<enclosure\s+([^>]+)\/?>/i)?.[1] ?? "";
    const enclosureUrl = attr(encTag, "url");
    const enclosureType = attr(encTag, "type");
    let audioUrl: string | null = null;
    if (enclosureUrl && (!enclosureType || enclosureType.includes("audio"))) {
      audioUrl = enclosureUrl;
    }

    const itunesImageTag = itemXml.match(/<itunes:image\s+([^>]+)\/?>/i)?.[1] ?? "";
    const itunesImage = attr(itunesImageTag, "href") || innerText(tagContent(itemXml, "itunes:image"));

    const mediaThumb = attr(
      itemXml.match(/<media:thumbnail[^/>]*\/?>/i)?.[0] ?? "",
      "url",
    );

    const image =
      itunesImage ||
      mediaThumb ||
      (tagContent(itemXml, "image") ? tagContent(itemXml, "image") : "") ||
      null;

    const description =
      innerText(tagContent(itemXml, "description")) ||
      innerText(tagContent(itemXml, "itunes:summary")) ||
      innerText(tagContent(itemXml, "content:encoded")) ||
      "";

    const link = innerText(tagContent(itemXml, "link"));
    const guid = innerText(tagContent(itemXml, "guid")) || link;
    const pubDate = tagContent(itemXml, "pubDate") || null;
    const duration = tagContent(itemXml, "itunes:duration") || null;

    const id = episodeIdFromRssItem(itemXml);
    let uniqueId = id;
    let n = 1;
    while (seen.has(uniqueId)) {
      uniqueId = `${id}-${n++}`;
    }
    seen.add(uniqueId);

    out.push({
      id: uniqueId,
      title,
      audioUrl,
      image: image || null,
      description,
      link,
      guid,
      pubDate,
      duration,
    });
  }

  return out;
}

/**
 * Cached RSS fetch for server components / build.
 * Next will dedupe in-flight requests per `fetch` + revalidate window.
 */
export async function fetchRssEpisodes(feedUrl: string): Promise<RssEpisode[]> {
  const res = await fetch(feedUrl, {
    next: { revalidate: RSS_CACHE_SECONDS },
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!res.ok) {
    throw new Error(`RSS fetch failed ${res.status}: ${feedUrl}`);
  }
  const xml = await res.text();
  return parseRssItems(xml);
}
