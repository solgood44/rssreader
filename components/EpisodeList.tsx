"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { RssEpisode } from "@/lib/rss";

const EPISODES_PAGE_SIZE = 40;

type Props = {
  showSlug: string;
  coverFallback?: string;
  episodes: RssEpisode[];
  page?: number;
};

/**
 * Episodes play inline on the show page only — audio URLs stay on the host/CDN from the RSS enclosure.
 */
export function EpisodeList({ showSlug, coverFallback, episodes, page = 1 }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [audioPaused, setAudioPaused] = useState(true);

  const sorted = [...episodes].sort((a, b) => {
    const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
    const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
    return tb - ta;
  });
  const start = (page - 1) * EPISODES_PAGE_SIZE;
  const slice = sorted.slice(start, start + EPISODES_PAGE_SIZE);
  const hasMore = start + EPISODES_PAGE_SIZE < sorted.length;

  const playEpisode = useCallback(
    (ep: RssEpisode) => {
      if (!ep.audioUrl || !audioRef.current) return;
      const el = audioRef.current;
      if (activeId === ep.id) {
        if (el.paused) void el.play().catch(() => {});
        else el.pause();
        return;
      }
      el.src = ep.audioUrl;
      setActiveId(ep.id);
      void el.play().catch(() => {});
    },
    [activeId],
  );

  const hasAnyAudio = slice.some((e) => e.audioUrl);

  return (
    <>
      {hasAnyAudio ? (
        <div className="show-audio-shell">
          <p className="show-audio-shell__label" id="show-audio-label">
            Now playing on this page
          </p>
          <audio
            ref={audioRef}
            className="audio-player show-audio-shell__player"
            controls
            preload="metadata"
            aria-labelledby="show-audio-label"
            onPlay={() => setAudioPaused(false)}
            onPause={() => setAudioPaused(true)}
          />
        </div>
      ) : null}

      <ol className="episode-list">
        {slice.map((ep) => {
          const thumb = ep.image || coverFallback;
          const isRowActive = activeId === ep.id;
          const label = isRowActive && !audioPaused ? "Pause" : "Play";
          return (
            <li key={ep.id} className={`episode-list__item${isRowActive ? " episode-list__item--active" : ""}`}>
              {thumb ? (
                <div className="episode-list__thumb" aria-hidden>
                  <Image src={thumb} alt="" width={72} height={72} sizes="72px" quality={65} className="episode-list__thumb-img" />
                </div>
              ) : (
                <div className="episode-list__thumb episode-list__thumb--empty" aria-hidden />
              )}
              <div className="episode-list__body">
                <div className="episode-list__text">
                  <span className="episode-list__title">{ep.title}</span>
                  {ep.pubDate ? (
                    <time className="episode-list__date" dateTime={ep.pubDate}>
                      {new Date(ep.pubDate).toLocaleDateString()}
                    </time>
                  ) : null}
                </div>
                <div className="episode-list__actions">
                  {ep.audioUrl ? (
                    <button
                      type="button"
                      className="episode-list__play"
                      onClick={() => playEpisode(ep)}
                      aria-label={`${label}: ${ep.title}`}
                    >
                      {label}
                    </button>
                  ) : (
                    <span className="episode-list__no-audio">No stream</span>
                  )}
                  {ep.link ? (
                    <a className="episode-list__out" href={ep.link} target="_blank" rel="noreferrer">
                      Spreaker ↗
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
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
