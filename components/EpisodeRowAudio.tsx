"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { RssEpisode } from "@/lib/rss";
import { getListenRecord, type ListenRecord } from "@/lib/listen-progress-storage";
import { useAudioPlayer } from "@/components/audio/AudioPlayerContext";

const RING_R = 20;
const RING_C = 2 * Math.PI * RING_R;

function ProgressRingPlayButton({
  progress,
  completed,
  playing,
  onClick,
  label,
}: {
  progress: number;
  completed: boolean;
  playing: boolean;
  onClick: () => void;
  label: string;
}) {
  const p = completed ? 1 : Math.min(1, Math.max(0, progress));
  const offset = RING_C * (1 - p);

  return (
    <button type="button" className="ep-ring-btn" onClick={onClick} aria-label={label}>
      <svg className="ep-ring-btn__svg" width="52" height="52" viewBox="0 0 52 52" aria-hidden>
        <circle className="ep-ring-btn__track" cx="26" cy="26" r={RING_R} fill="none" strokeWidth="2.5" />
        <circle
          className={completed ? "ep-ring-btn__fill ep-ring-btn__fill--done" : "ep-ring-btn__fill"}
          cx="26"
          cy="26"
          r={RING_R}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
        />
        {playing ? (
          <g className="ep-ring-btn__icon" transform="translate(26,26)">
            <path d="M-5 -8h3v16h-3zm7 0h3v16h-3z" fill="currentColor" />
          </g>
        ) : (
          <g className="ep-ring-btn__icon" transform="translate(26,26)">
            <path d="M-4 -7l14 7-14 7z" fill="currentColor" />
          </g>
        )}
      </svg>
    </button>
  );
}

type Props = {
  ep: RssEpisode;
  coverFallback?: string;
  showTitle: string;
  showSlug: string;
};

/**
 * Play/pause routes through the global dock player so audio survives navigation.
 */
export function EpisodeRowAudio({ ep, coverFallback, showTitle, showSlug }: Props) {
  const player = useAudioPlayer();
  const [stored, setStored] = useState<ListenRecord | null>(null);

  const url = ep.audioUrl;
  const thumb = ep.image || coverFallback;

  useEffect(() => {
    setStored(getListenRecord(url ?? undefined));
  }, [url]);

  const isActive = !!(url && player.current?.url === url);
  const playing = isActive && player.isPlaying;

  const displayProgress =
    stored?.completed ? 1
    : isActive && player.duration > 0 && isFinite(player.duration) ? player.currentTime / player.duration
    : (stored?.progress ?? 0);

  const completed = !!stored?.completed;

  const onRingClick = useCallback(() => {
    if (!url) return;
    if (isActive) {
      player.togglePlay();
      return;
    }
    player.loadAndPlay({
      url,
      title: ep.title,
      artwork: thumb,
      showTitle,
      showSlug,
      episodeId: ep.id,
    });
  }, [url, isActive, player, ep.title, thumb, showTitle, showSlug]);

  return (
    <li className={`episode-list__item${completed ? " episode-list__item--completed" : ""}`}>
      <div className="episode-list__row-head">
        {url ? (
          <ProgressRingPlayButton
            progress={displayProgress}
            completed={completed}
            playing={playing}
            onClick={onRingClick}
            label={playing ? `Pause: ${ep.title}` : `Play: ${ep.title}`}
          />
        ) : (
          <div className="ep-ring-btn ep-ring-btn--disabled" aria-hidden>
            <svg className="ep-ring-btn__svg" width="52" height="52" viewBox="0 0 52 52">
              <circle className="ep-ring-btn__track" cx="26" cy="26" r={RING_R} fill="none" strokeWidth="2.5" />
            </svg>
          </div>
        )}

        {thumb ? (
          <div className="episode-list__thumb" aria-hidden>
            <Image
              src={thumb}
              alt=""
              width={72}
              height={72}
              sizes="72px"
              quality={65}
              className="episode-list__thumb-img"
              style={{ objectFit: "contain" }}
            />
          </div>
        ) : (
          <div className="episode-list__thumb episode-list__thumb--empty" aria-hidden />
        )}

        <div className="episode-list__text">
          <span className="episode-list__title">{ep.title}</span>
          {ep.pubDate ? (
            <time className="episode-list__date" dateTime={ep.pubDate}>
              {new Date(ep.pubDate).toLocaleDateString()}
            </time>
          ) : null}
        </div>
      </div>
    </li>
  );
}
