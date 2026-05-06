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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value) / 100;
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
    <div className={`audio-dock${p.dockExpanded ? " audio-dock--expanded" : ""}`} role="region" aria-label="Now playing">
      <div className="audio-dock__progress-line" aria-hidden>
        <div className="audio-dock__progress-fill" style={{ width: `${frac * 100}%` }} />
      </div>

      <div className="audio-dock__shell">
        <div className="audio-dock__row">
          <button
            type="button"
            className="audio-dock__expand-hit"
            onClick={() => p.setDockExpanded(!p.dockExpanded)}
            aria-expanded={p.dockExpanded}
            aria-label={p.dockExpanded ? "Collapse player" : "Expand player"}
          >
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
          </button>

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
            <div className="audio-dock__vol audio-dock__vol--compact">
              <span className="audio-dock__vol-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              </span>
              <input
                type="range"
                className="audio-dock__vol-range"
                min={0}
                max={100}
                value={Math.round(p.volume * 100)}
                onChange={(e) => p.setVolume(parseInt(e.target.value, 10) / 100)}
                aria-label="Volume"
              />
            </div>

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

            <button
              type="button"
              className="audio-dock__chev"
              onClick={() => p.setDockExpanded(!p.dockExpanded)}
              aria-label={p.dockExpanded ? "Collapse" : "Expand"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                {p.dockExpanded ? <path d="M6 15l6-6 6 6" /> : <path d="M18 9l-6 6-6-6" />}
              </svg>
            </button>
          </div>
        </div>

        {p.dockExpanded ? (
          <div className="audio-dock__expanded">
            <div className="audio-dock__seek-row">
              <span className="audio-dock__time">{fmtTime(p.currentTime)}</span>
              <input
                type="range"
                className="audio-dock__seek"
                min={0}
                max={100}
                step={0.1}
                value={frac * 100}
                onChange={onSeek}
                aria-label="Seek"
              />
              <span className="audio-dock__time">{fmtTime(p.duration)}</span>
            </div>
            <div className="audio-dock__vol audio-dock__vol--wide">
              <span className="audio-dock__vol-icon" aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </span>
              <input
                type="range"
                className="audio-dock__vol-range audio-dock__vol-range--wide"
                min={0}
                max={100}
                value={Math.round(p.volume * 100)}
                onChange={(e) => p.setVolume(parseInt(e.target.value, 10) / 100)}
                aria-label="Volume"
              />
              <span className="audio-dock__vol-num">{Math.round(p.volume * 100)}%</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
