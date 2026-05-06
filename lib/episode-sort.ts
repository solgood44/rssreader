import type { RssEpisode } from "@/lib/rss";

export type EpisodeSortMode = "newest" | "oldest" | "episode";

/** Leading episode number from title when iTunes episode tag is missing. */
function parseTitleOrdinal(title: string): number | null {
  const t = title.trim();
  const patterns = [
    /^(?:ep|episode|part)\s*[#:.]?\s*(\d+)/i,
    /^#(\d+)\b/,
    /^\[(\d+)\]/,
    /^(\d{1,4})\s*[-–—.:)]\s+/,
    /^(\d{1,4})\s+\|/,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

export function episodeOrdinal(ep: RssEpisode): number | null {
  if (ep.itunesEpisode != null && Number.isFinite(ep.itunesEpisode)) return ep.itunesEpisode;
  return parseTitleOrdinal(ep.title);
}

/** True when enough episodes look numbered — default sort becomes episode order (1, 2, 3…). */
export function detectNumberedEpisodes(episodes: RssEpisode[]): boolean {
  if (episodes.length < 2) return false;
  let n = 0;
  for (const ep of episodes) {
    if (episodeOrdinal(ep) != null) n++;
  }
  return n >= Math.max(2, Math.ceil(episodes.length * 0.25));
}

function pubTime(ep: RssEpisode): number {
  return ep.pubDate ? Date.parse(ep.pubDate) : 0;
}

export function sortEpisodes(episodes: RssEpisode[], mode: EpisodeSortMode): RssEpisode[] {
  const arr = [...episodes];
  if (mode === "newest") {
    arr.sort((a, b) => pubTime(b) - pubTime(a));
  } else if (mode === "oldest") {
    arr.sort((a, b) => pubTime(a) - pubTime(b));
  } else {
    arr.sort((a, b) => {
      const oa = episodeOrdinal(a);
      const ob = episodeOrdinal(b);
      if (oa != null && ob != null && oa !== ob) return oa - ob;
      if (oa != null && ob == null) return -1;
      if (oa == null && ob != null) return 1;
      return pubTime(b) - pubTime(a);
    });
  }
  return arr;
}

/** Resolve sort mode from `?sort=` or automatic numbering detection. */
export function resolveEpisodeSort(requested: string | undefined, episodes: RssEpisode[]): EpisodeSortMode {
  if (requested === "newest" || requested === "oldest" || requested === "episode") return requested;
  return detectNumberedEpisodes(episodes) ? "episode" : "newest";
}
