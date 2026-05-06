import type { RssEpisode } from "@/lib/rss";

export type EpisodeSortMode = "newest" | "oldest" | "episode";

/** "Chapter 3", "Act 2", "Scene 4", "Play 1" — typical serialized feed order. */
function parseSerialOrdinal(title: string): number | null {
  const t = title.trim();
  const patterns = [
    /\bchapter\s*[#:.]?\s*(\d+)\b/i,
    /\bch\.?\s*[#:.]?\s*(\d+)\b/i,
    /\bact\s*[#:.]?\s*(\d+)\b/i,
    /\bscene\s*[#:.]?\s*(\d+)\b/i,
    /\bplay\s*[#:.]?\s*(\d+)\b/i,
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

/** "01 Title", "002 - Title" — often chronological series. */
function hasLeadingZeroNumber(title: string): boolean {
  const t = title.trim();
  return /^0\d{1,3}\b/.test(t);
}

/** Leading episode number from title when iTunes episode tag is missing. */
function parseTitleOrdinal(title: string): number | null {
  const t = title.trim();
  const patterns = [
    /^(?:ep|episode|part)\s*[#:.]?\s*(\d+)/i,
    /^#(\d+)\b/,
    /^\[(\d+)\]/,
    /^(\d{2,4})\b/,
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
  const serial = parseSerialOrdinal(ep.title);
  if (serial != null) return serial;
  return parseTitleOrdinal(ep.title);
}

/** True when titles look like Chapter/Act/Scene/Play or zero-padded numbers — default sort is oldest → newest. */
export function detectChronologicalSerialEpisodes(episodes: RssEpisode[]): boolean {
  if (episodes.length < 2) return false;
  let n = 0;
  for (const ep of episodes) {
    if (parseSerialOrdinal(ep.title) != null || hasLeadingZeroNumber(ep.title)) n++;
  }
  return n >= Math.max(2, Math.ceil(episodes.length * 0.25));
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

/** Resolve sort mode from `?sort=` or automatic detection (chapters → oldest first; else episode #). */
export function resolveEpisodeSort(requested: string | undefined, episodes: RssEpisode[]): EpisodeSortMode {
  if (requested === "newest" || requested === "oldest" || requested === "episode") return requested;
  if (detectChronologicalSerialEpisodes(episodes)) return "oldest";
  if (detectNumberedEpisodes(episodes)) return "episode";
  return "newest";
}
