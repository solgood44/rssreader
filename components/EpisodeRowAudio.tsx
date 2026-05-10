"use client";

import { useCallback, useEffect, useState } from "react";
import type { RssEpisode } from "@/lib/rss";
import { getListenRecord, type ListenRecord } from "@/lib/listen-progress-storage";
import { useAudioPlayer } from "@/components/audio/AudioPlayerContext";
import { ProgressRingPlayButton } from "@/components/ProgressRingPlayButton";

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
              <circle className="ep-ring-btn__track" cx="26" cy="26" r={20} fill="none" strokeWidth="2.5" />
            </svg>
          </div>
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
