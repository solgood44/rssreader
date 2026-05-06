"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "./AudioPlayerContext";

function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (h > 0) return `${h}:${pad(m)}:${pad(r)}`;
  return `${m}:${pad(r)}`;
}

export function AudioDock() {
  const p = useAudioPlayer();
  const [sleepOpen, setSleepOpen] = useState(false);
  const sleepPopoverRef = useRef<HTMLDivElement>(null);

  const frac = p.duration > 0 && isFinite(p.duration) ? Math.min(1, p.currentTime / p.duration) : 0;

  const onSeek = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const v = parseFloat(e.currentTarget.value) / 100;
      p.seekFraction(v);
    },
    [p],
  );

  useEffect(() => {
    if (!sleepOpen) return;
    const close = (e: MouseEvent) => {
      if (sleepPopoverRef.current?.contains(e.target as Node)) return;
      setSleepOpen(false);
    };
    const id = window.setTimeout(() => document.addEventListener("click", close), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", close);
    };
  }, [sleepOpen]);

  if (!p.current) return null;

  const { current: t } = p;
  const art = t.artwork;

  return (
    <div className="audio-dock" role="region" aria-label="Now playing">
      {/* Single thin scrubber — same on mobile and desktop (no extra expand panel). */}
      <div className="audio-dock__timeline">
        <span className="audio-dock__tmini" aria-hidden>
          {fmtTime(p.currentTime)}
        </span>
        <span className="audio-dock__timeline-label" aria-hidden>
          Position
        </span>
        <div className="audio-dock__scrub-wrap">
          <div className="audio-dock__scrub-line" aria-hidden>
            <div className="audio-dock__scrub-fill" style={{ width: `${frac * 100}%` }} />
          </div>
          <input
            type="range"
            className="audio-dock__scrub-input"
            min={0}
            max={100}
            step={0.1}
            value={frac * 100}
            onChange={onSeek}
            onInput={onSeek}
            aria-label="Seek playback position in episode"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(frac * 100)}
            aria-valuetext={`${fmtTime(p.currentTime)} of ${fmtTime(p.duration)}`}
          />
        </div>
        <span className="audio-dock__tmini" aria-hidden>
          {fmtTime(p.duration)}
        </span>
      </div>

      <div className="audio-dock__shell">
        <div className="audio-dock__row">
          <div className="audio-dock__now">
            {art ? (
              <span className="audio-dock__art">
                <Image src={art} alt="" width={48} height={48} className="audio-dock__art-img" sizes="48px" />
              </span>
            ) : (
              <span className="audio-dock__art audio-dock__art--placeholder" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </span>
            )}
            <span className="audio-dock__titles">
              <span className="audio-dock__episode-title">{t.title}</span>
              {t.showTitle ? <span className="audio-dock__show-title">{t.showTitle}</span> : null}
            </span>
          </div>

          <div className="audio-dock__transport">
            <button type="button" className="audio-dock__skip" onClick={() => p.skip(-10)} aria-label="Back 10 seconds">
              −10
            </button>
            <button
              type="button"
              className="audio-dock__play"
              onClick={() => p.togglePlay()}
              aria-label={p.isPlaying ? "Pause" : "Play"}
            >
              {p.isPlaying ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button type="button" className="audio-dock__skip" onClick={() => p.skip(30)} aria-label="Forward 30 seconds">
              +30
            </button>
          </div>

          <div className="audio-dock__side-controls">
            <div className="audio-dock__sleep-wrap" ref={sleepPopoverRef}>
              <button
                type="button"
                className={`audio-dock__sleep-btn${p.sleepMode !== "off" ? " audio-dock__sleep-btn--on" : ""}`}
                aria-expanded={sleepOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setSleepOpen(!sleepOpen);
                }}
                aria-label="Sleep timer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.34 2.02C6.59 1.82 2 6.57 2 12c0 5.52 4.48 10 10 10 3.71 0 6.93-2.02 8.66-5.02-7.51-.25-12.09-8.86-8.32-14.96z" />
                </svg>
                {p.sleepMode !== "off" ? <span className="audio-dock__sleep-dot" /> : null}
              </button>
              {sleepOpen ? (
                <div className="audio-dock__sleep-pop" role="dialog" aria-label="Sleep timer">
                  <p className="audio-dock__sleep-head">Stop playback after…</p>
                  {p.sleepMode === "timer" && p.sleepEndAt ? (
                    <p className="audio-dock__sleep-count">{p.sleepLabel} left</p>
                  ) : p.sleepMode === "end" ? (
                    <p className="audio-dock__sleep-count">{p.sleepLabel}</p>
                  ) : null}
                  <div className="audio-dock__sleep-presets">
                    {[5, 10, 15, 30, 60].map((m) => (
                      <button key={m} type="button" className="audio-dock__sleep-preset" onClick={() => p.setSleepTimerMinutes(m)}>
                        {m}m
                      </button>
                    ))}
                    <button type="button" className="audio-dock__sleep-preset" onClick={() => p.setSleepEndOfEpisode()}>
                      End of episode
                    </button>
                  </div>
                  <button type="button" className="audio-dock__sleep-clear" onClick={() => p.clearSleepTimer()}>
                    Turn off timer
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
