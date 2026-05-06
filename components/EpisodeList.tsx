"use client";

import Link from "next/link";
import type { RssEpisode } from "@/lib/rss";
import type { EpisodeSortMode } from "@/lib/episode-sort";
import { sortEpisodes } from "@/lib/episode-sort";
import { EpisodeRowAudio } from "./EpisodeRowAudio";

const EPISODES_PAGE_SIZE = 40;

type Props = {
  showSlug: string;
  showTitle: string;
  coverFallback?: string;
  episodes: RssEpisode[];
  sort: EpisodeSortMode;
  /** Preserve `?sort=` in pagination when the visitor chose an explicit order. */
  sortQuery?: string;
  numberedDetected: boolean;
  page?: number;
};

function querySuffix(page: number, sortQuery?: string): string {
  const q = new URLSearchParams();
  if (page > 1) q.set("page", String(page));
  if (sortQuery) q.set("sort", sortQuery);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/**
 * Episode rows control the global bottom player (persists across pages).
 */
export function EpisodeList({
  showSlug,
  showTitle,
  coverFallback,
  episodes,
  sort,
  sortQuery,
  numberedDetected,
  page = 1,
}: Props) {
  const sorted = sortEpisodes(episodes, sort);
  const start = (page - 1) * EPISODES_PAGE_SIZE;
  const slice = sorted.slice(start, start + EPISODES_PAGE_SIZE);
  const hasMore = start + EPISODES_PAGE_SIZE < sorted.length;

  const base = `/shows/${showSlug}`;
  /** Always set `sort` so “Newest” overrides automatic episode-number order on numbered shows. */
  const sortHref = (mode: EpisodeSortMode) => `${base}?sort=${mode}`;

  return (
    <>
      <div className="episode-sort" role="group" aria-label="Episode order">
        <span className="episode-sort__label">Sort</span>
        <div className="episode-sort__pills">
          <Link
            href={sortHref("newest")}
            className={`episode-sort__pill${sort === "newest" ? " is-active" : ""}`}
            scroll={false}
          >
            Newest
          </Link>
          <Link
            href={sortHref("oldest")}
            className={`episode-sort__pill${sort === "oldest" ? " is-active" : ""}`}
            scroll={false}
          >
            Oldest
          </Link>
          {numberedDetected ? (
            <Link
              href={sortHref("episode")}
              className={`episode-sort__pill${sort === "episode" ? " is-active" : ""}`}
              scroll={false}
            >
              By episode #
            </Link>
          ) : null}
        </div>
      </div>

      <ol className="episode-list episode-list--stacked">
        {slice.map((ep) => (
          <EpisodeRowAudio
            key={ep.id}
            ep={ep}
            coverFallback={coverFallback}
            showTitle={showTitle}
            showSlug={showSlug}
          />
        ))}
      </ol>
      {hasMore ? (
        <p className="pager">
          <Link href={`${base}${querySuffix(page + 1, sortQuery)}`} className="pager__link" scroll={false}>
            Load more episodes →
          </Link>
        </p>
      ) : null}
    </>
  );
}
