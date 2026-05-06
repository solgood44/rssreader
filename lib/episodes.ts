import type { RssEpisode } from "./rss";

/** Composite slug used in /episode/[slug] — never guess: always rebuild from show + RSS id. */
export function compositeEpisodeSlug(showSlug: string, episodeId: string) {
  return `${showSlug}__${episodeId}`;
}

export function parseCompositeEpisodeSlug(full: string): { showSlug: string; episodeId: string } | null {
  const i = full.indexOf("__");
  if (i <= 0) return null;
  return { showSlug: full.slice(0, i), episodeId: full.slice(i + 2) };
}

export function findEpisode(episodes: RssEpisode[], episodeId: string): RssEpisode | undefined {
  return episodes.find((e) => e.id === episodeId);
}
