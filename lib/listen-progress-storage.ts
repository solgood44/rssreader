/**
 * Persist per-episode listen progress in localStorage (device-local, Pocket Casts–style).
 * Keyed by audio URL from the RSS enclosure.
 */

export type ListenRecord = {
  progress: number;
  completed: boolean;
  updatedAt: number;
};

const KEY = "rssreader_listen_v1";

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
): void {
  if (typeof window === "undefined" || !audioUrl) return;
  try {
    const map = loadListenMap();
    map[audioUrl] = {
      progress: Math.min(1, Math.max(0, progress)),
      completed,
      updatedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
}
