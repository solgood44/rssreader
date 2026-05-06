"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RssEpisode } from "@/lib/rss";
import { getListenRecord, saveListenRecord, type ListenRecord } from "@/lib/listen-progress-storage";

const RING_R = 20;
const RING_C = 2 * Math.PI * RING_R;
const SAVE_MS = 2000;

function pauseOtherEpisodeAudios(current: HTMLAudioElement) {
  document.querySelectorAll<HTMLAudioElement>("audio.episode-list__audio").forEach((el) => {
    if (el !== current && !el.paused) el.pause();
  });
}

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

export function EpisodeRowAudio({ ep, coverFallback }: { ep: RssEpisode; coverFallback?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSaveRef = useRef(0);
  const restoredRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [stored, setStored] = useState<ListenRecord | null>(null);
  /** Live fraction while element reports time; drives ring during playback. */
  const [liveFrac, setLiveFrac] = useState<number | null>(null);

  const url = ep.audioUrl;

  useEffect(() => {
    setStored(getListenRecord(url ?? undefined));
    restoredRef.current = false;
  }, [url]);

  /** Resume roughly where the listener left off (same device). */
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !url) return;
    const rec = getListenRecord(url);
    if (!rec || rec.completed || rec.progress < 0.04 || rec.progress > 0.96) return;
    const onMeta = () => {
      if (!a.duration || !isFinite(a.duration) || restoredRef.current) return;
      restoredRef.current = true;
      a.currentTime = rec.progress * a.duration;
    };
    a.addEventListener("loadedmetadata", onMeta);
    return () => a.removeEventListener("loadedmetadata", onMeta);
  }, [url]);

  const flushProgress = useCallback(() => {
    const a = audioRef.current;
    if (!url || !a || !a.duration || !isFinite(a.duration)) return;
    const frac = Math.min(1, a.currentTime / a.duration);
    const done = frac >= 0.97;
    saveListenRecord(url, done ? 1 : frac, done);
    setStored(getListenRecord(url));
    setLiveFrac(null);
  }, [url]);

  const onTimeUpdate = useCallback(() => {
    const a = audioRef.current;
    if (!a?.duration || !isFinite(a.duration)) return;
    const frac = Math.min(1, a.currentTime / a.duration);
    setLiveFrac(frac);
    const now = Date.now();
    if (now - lastSaveRef.current >= SAVE_MS) {
      lastSaveRef.current = now;
      const done = frac >= 0.97;
      if (url) saveListenRecord(url, done ? 1 : frac, done);
    }
  }, [url]);

  const displayProgress = stored?.completed
    ? 1
    : playing && liveFrac !== null
      ? liveFrac
      : (stored?.progress ?? 0);

  const completed = !!stored?.completed;

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !url) return;
    pauseOtherEpisodeAudios(a);
    if (!a.paused) {
      a.pause();
      flushProgress();
      return;
    }
    void a.play().catch(() => {});
  }, [url, flushProgress]);

  const thumb = ep.image || coverFallback;

  return (
    <li className={`episode-list__item${completed ? " episode-list__item--completed" : ""}`}>
      <div className="episode-list__row-head">
        {url ? (
          <ProgressRingPlayButton
            progress={displayProgress}
            completed={completed}
            playing={playing}
            onClick={togglePlay}
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
            <Image src={thumb} alt="" width={72} height={72} sizes="72px" quality={65} className="episode-list__thumb-img" />
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

      {url ? (
        <audio
          ref={audioRef}
          className="audio-player episode-list__audio"
          src={url}
          controls
          preload="metadata"
          onPlay={(e) => {
            pauseOtherEpisodeAudios(e.currentTarget);
            setPlaying(true);
          }}
          onPause={() => {
            setPlaying(false);
            flushProgress();
          }}
          onTimeUpdate={onTimeUpdate}
          onEnded={() => {
            setPlaying(false);
            if (url) saveListenRecord(url, 1, true);
            setStored(getListenRecord(url));
            setLiveFrac(null);
          }}
        />
      ) : (
        <p className="episode-list__no-audio">No stream in feed</p>
      )}
    </li>
  );
}
