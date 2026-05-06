/**
 * Persist per-episode listen progress in localStorage (device-local, Pocket Casts–style).
 * Keyed by audio URL from the RSS enclosure.
 */

export type ListenMeta = {
  title?: string;
  showTitle?: string;
  showSlug?: string;
  artwork?: string;
  episodeId?: string;
};

export type ListenRecord = {
  progress: number;
  completed: boolean;
  updatedAt: number;
} & ListenMeta;

const KEY = "rssreader_listen_v1";

export const LISTEN_PROGRESS_UPDATED_EVENT = "listen-progress-updated";

export function loadListenMap(): Record<string, ListenRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, ListenRecord>;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

export function getListenRecord(audioUrl: string | undefined | null): ListenRecord | null {
  if (!audioUrl) return null;
  return loadListenMap()[audioUrl] ?? null;
}

export function saveListenRecord(
  audioUrl: string,
  progress: number,
  completed: boolean,
  meta?: ListenMeta,
): void {
  if (typeof window === "undefined" || !audioUrl) return;
  try {
    const map = loadListenMap();
    const prev = map[audioUrl];
    const mergedMeta: ListenMeta = {
      ...(prev
        ? {
            title: prev.title,
            showTitle: prev.showTitle,
            showSlug: prev.showSlug,
            artwork: prev.artwork,
            episodeId: prev.episodeId,
          }
        : {}),
      ...meta,
    };
    map[audioUrl] = {
      progress: Math.min(1, Math.max(0, progress)),
      completed,
      updatedAt: Date.now(),
      ...mergedMeta,
    };
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(LISTEN_PROGRESS_UPDATED_EVENT));
  } catch {
    /* quota / private mode */
  }
}

/** Most recently updated listens (for nav / resume UI). */
export function getRecentListens(limit = 10): Array<{ url: string; record: ListenRecord }> {
  if (typeof window === "undefined") return [];
  const map = loadListenMap();
  return Object.entries(map)
    .map(([url, record]) => ({ url, record }))
    .sort((a, b) => b.record.updatedAt - a.record.updatedAt)
    .slice(0, Math.max(0, limit));
}
