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

export const LISTEN_MAP_STORAGE_KEY = "rssreader_listen_v1";
export const LISTEN_ORDER_STORAGE_KEY = "rssreader_listen_order_v1";

export const LISTEN_PROGRESS_UPDATED_EVENT = "listen-progress-updated";

export function loadListenMap(): Record<string, ListenRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LISTEN_MAP_STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, ListenRecord>;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

function loadListenOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LISTEN_ORDER_STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function persistListenOrder(order: string[]): void {
  localStorage.setItem(LISTEN_ORDER_STORAGE_KEY, JSON.stringify(order));
}

/** Full ordered URL list for every entry in map (persists when new keys need to be merged). */
function getResolvedOrder(map: Record<string, ListenRecord>): string[] {
  const keys = Object.keys(map);
  let order = loadListenOrder().filter((u) => keys.includes(u));
  let changed = false;
  if (order.length === 0 && keys.length > 0) {
    order = [...keys].sort((a, b) => map[b].updatedAt - map[a].updatedAt);
    changed = true;
  } else {
    const have = new Set(order);
    const missing = keys.filter((k) => !have.has(k)).sort((a, b) => map[b].updatedAt - map[a].updatedAt);
    if (missing.length > 0) {
      order = [...order, ...missing];
      changed = true;
    }
  }
  if (changed) persistListenOrder(order);
  return order;
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
    localStorage.setItem(LISTEN_MAP_STORAGE_KEY, JSON.stringify(map));
    let order = getResolvedOrder(map);
    order = order.filter((u) => u !== audioUrl);
    order.unshift(audioUrl);
    persistListenOrder(order);
    window.dispatchEvent(new Event(LISTEN_PROGRESS_UPDATED_EVENT));
  } catch {
    /* quota / private mode */
  }
}

export function deleteListenRecord(url: string): void {
  if (typeof window === "undefined" || !url) return;
  try {
    const map = loadListenMap();
    if (!(url in map)) return;
    delete map[url];
    localStorage.setItem(LISTEN_MAP_STORAGE_KEY, JSON.stringify(map));
    const order = loadListenOrder().filter((u) => u !== url && u in map);
    persistListenOrder(order);
    window.dispatchEvent(new Event(LISTEN_PROGRESS_UPDATED_EVENT));
  } catch {
    /* quota / private mode */
  }
}

/** Swap with previous (-1) or next (+1) item in the saved order. */
export function moveListenRecord(url: string, delta: -1 | 1): void {
  if (typeof window === "undefined" || !url) return;
  try {
    const map = loadListenMap();
    if (!(url in map)) return;
    let order = getResolvedOrder(map);
    const i = order.indexOf(url);
    if (i < 0) return;
    const j = i + delta;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    persistListenOrder(next);
    window.dispatchEvent(new Event(LISTEN_PROGRESS_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
}

/** Most recently updated listens (respects manual order; playback bumps an item to the top). */
export function getRecentListens(limit = 10): Array<{ url: string; record: ListenRecord }> {
  if (typeof window === "undefined") return [];
  const map = loadListenMap();
  const order = getResolvedOrder(map);
  return order.slice(0, Math.max(0, limit)).map((url) => ({ url, record: map[url] }));
}

/** Full list for /recent (same order as nav / player). */
export function getOrderedListens(): Array<{ url: string; record: ListenRecord }> {
  if (typeof window === "undefined") return [];
  const map = loadListenMap();
  const order = getResolvedOrder(map);
  return order.map((url) => ({ url, record: map[url] }));
}
