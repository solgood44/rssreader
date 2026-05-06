"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAudioPlayer } from "@/components/audio/AudioPlayerContext";
import {
  deleteListenRecord,
  getOrderedListens,
  LISTEN_MAP_STORAGE_KEY,
  LISTEN_ORDER_STORAGE_KEY,
  LISTEN_PROGRESS_UPDATED_EVENT,
  moveListenRecord,
  type ListenRecord,
} from "@/lib/listen-progress-storage";

type Row = { url: string; record: ListenRecord };

export function RecentListPage() {
  const player = useAudioPlayer();
  const [rows, setRows] = useState<Row[] | null>(null);

  const refresh = useCallback(() => {
    setRows(getOrderedListens());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === LISTEN_MAP_STORAGE_KEY ||
        e.key === LISTEN_ORDER_STORAGE_KEY ||
        e.key === null
      ) {
        refresh();
      }
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener(LISTEN_PROGRESS_UPDATED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LISTEN_PROGRESS_UPDATED_EVENT, onCustom);
    };
  }, [refresh]);

  if (rows === null) {
    return (
      <div className="recent-page">
        <h1 className="hero__title">Recently listened</h1>
        <p className="hero__lede" style={{ color: "var(--muted)" }}>
          Loading your list…
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="recent-page">
        <h1 className="hero__title">Recently listened</h1>
        <p className="hero__lede">Nothing here yet. Play an episode from a show and it will show up with progress saved in this browser.</p>
        <p className="section-sub">
          <Link href="/shows">Browse shows</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="recent-page">
      <h1 className="hero__title">Recently listened</h1>
      <p className="hero__lede">
        Resume episodes or reorder the list. Progress stays on this device only.{" "}
        <Link href="/shows">Browse shows</Link>
      </p>

      <ul className="recent-list" role="list">
        {rows.map(({ url, record }, index) => {
          const title = record.title?.trim() || "Episode";
          const show = record.showTitle?.trim();
          const pct = record.completed ? 100 : Math.round(Math.min(1, Math.max(0, record.progress)) * 100);
          const art = record.artwork?.trim();
          const isFirst = index === 0;
          const isLast = index === rows.length - 1;

          return (
            <li key={url} className="recent-list__item">
              <button
                type="button"
                className="recent-list__main"
                onClick={() =>
                  player.loadAndPlay({
                    url,
                    title,
                    showTitle: show,
                    showSlug: record.showSlug,
                    artwork: record.artwork,
                    episodeId: record.episodeId,
                  })
                }
              >
                {art ? (
                  <span className="recent-list__art">
                    <Image
                      src={art}
                      alt=""
                      width={56}
                      height={56}
                      className="recent-list__art-img"
                      sizes="56px"
                      unoptimized
                    />
                  </span>
                ) : (
                  <span className="recent-list__art recent-list__art--placeholder" aria-hidden>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </span>
                )}
                <span className="recent-list__text">
                  <span className="recent-list__title">{title}</span>
                  {show ? <span className="recent-list__show">{show}</span> : null}
                  <span className="recent-list__track" aria-hidden>
                    <span className="recent-list__fill" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="recent-list__pct">{record.completed ? "Done" : `${pct}%`}</span>
                </span>
              </button>

              <div className="recent-list__tools">
                <button
                  type="button"
                  className="recent-list__tool"
                  disabled={isFirst}
                  onClick={() => moveListenRecord(url, -1)}
                  aria-label={`Move “${title}” up in list`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="recent-list__tool"
                  disabled={isLast}
                  onClick={() => moveListenRecord(url, 1)}
                  aria-label={`Move “${title}” down in list`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="recent-list__tool recent-list__tool--danger"
                  onClick={() => {
                    if (window.confirm(`Remove “${title}” from this list? Progress for this episode will be forgotten on this device.`)) {
                      deleteListenRecord(url);
                    }
                  }}
                  aria-label={`Remove “${title}” from recently listened`}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
