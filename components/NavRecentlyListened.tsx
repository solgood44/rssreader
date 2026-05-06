"use client";

import { useCallback, useEffect, useState } from "react";
import { useAudioPlayer } from "@/components/audio/AudioPlayerContext";
import { getRecentListens, LISTEN_PROGRESS_UPDATED_EVENT, type ListenRecord } from "@/lib/listen-progress-storage";

type Row = { url: string; record: ListenRecord };

export function NavRecentlyListened({ onPick }: { onPick: () => void }) {
  const player = useAudioPlayer();
  const [rows, setRows] = useState<Row[]>([]);

  const refresh = useCallback(() => {
    setRows(getRecentListens(8));
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "rssreader_listen_v1" || e.key === null) refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener(LISTEN_PROGRESS_UPDATED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LISTEN_PROGRESS_UPDATED_EVENT, onCustom);
    };
  }, [refresh]);

  if (rows.length === 0) {
    return (
      <div className="nav-drawer__recent nav-drawer__recent--empty">
        <p className="nav-drawer__recent-head">Recently listened</p>
        <p className="nav-drawer__recent-hint">Play an episode to see it here. Progress is saved in this browser.</p>
      </div>
    );
  }

  return (
    <div className="nav-drawer__recent">
      <p className="nav-drawer__recent-head">Recently listened</p>
      <ul className="nav-drawer__recent-list" role="list">
        {rows.map(({ url, record }) => {
          const title = record.title?.trim() || "Episode";
          const show = record.showTitle?.trim();
          const pct = record.completed ? 100 : Math.round(Math.min(1, Math.max(0, record.progress)) * 100);
          return (
            <li key={url}>
              <button
                type="button"
                className="nav-drawer__recent-btn"
                onClick={() => {
                  player.loadAndPlay({
                    url,
                    title,
                    showTitle: show,
                    showSlug: record.showSlug,
                    artwork: record.artwork,
                    episodeId: record.episodeId,
                  });
                  onPick();
                }}
              >
                <span className="nav-drawer__recent-title">{title}</span>
                {show ? <span className="nav-drawer__recent-show">{show}</span> : null}
                <span className="nav-drawer__recent-track" aria-hidden>
                  <span className="nav-drawer__recent-fill" style={{ width: `${pct}%` }} />
                </span>
                <span className="nav-drawer__recent-pct">{record.completed ? "Done" : `${pct}%`}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
