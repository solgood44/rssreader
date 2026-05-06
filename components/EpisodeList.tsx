"use client";

import Link from "next/link";
import type { RssEpisode } from "@/lib/rss";
import { EpisodeRowAudio } from "./EpisodeRowAudio";

const EPISODES_PAGE_SIZE = 40;

type Props = {
  showSlug: string;
  coverFallback?: string;
  episodes: RssEpisode[];
  page?: number;
};

/**
 * Each episode has its own player, timeline, and ring progress (listen state in localStorage).
 */
export function EpisodeList({ showSlug, coverFallback, episodes, page = 1 }: Props) {
  const sorted = [...episodes].sort((a, b) => {
    const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
    const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
    return tb - ta;
  });
  const start = (page - 1) * EPISODES_PAGE_SIZE;
  const slice = sorted.slice(start, start + EPISODES_PAGE_SIZE);
  const hasMore = start + EPISODES_PAGE_SIZE < sorted.length;

  return (
    <>
      <ol className="episode-list episode-list--stacked">
        {slice.map((ep) => (
          <EpisodeRowAudio key={ep.id} ep={ep} coverFallback={coverFallback} />
        ))}
      </ol>
      {hasMore ? (
        <p className="pager">
          <Link href={`/shows/${showSlug}?page=${page + 1}`} className="pager__link">
            Load more episodes →
          </Link>
        </p>
      ) : null}
    </>
  );
}
