export const GA_MEASUREMENT_ID = "G-9CDHCMHT8J";

type GtagFn = (...args: any[]) => void;

function gtag(): GtagFn | null {
  const w = typeof window !== "undefined" ? (window as any) : null;
  const fn = w?.gtag;
  return typeof fn === "function" ? (fn as GtagFn) : null;
}

export function gaPageView(path: string) {
  const fn = gtag();
  if (!fn) return;
  fn("config", GA_MEASUREMENT_ID, { page_path: path });
}

export function gaEvent(name: string, params?: Record<string, unknown>) {
  const fn = gtag();
  if (!fn) return;
  fn("event", name, params ?? {});
}

export type AudioEventMeta = {
  audio_url: string;
  episode_title: string;
  episode_id?: string;
  show_title?: string;
  show_slug?: string;
};

export function gaAudioEvent(name: string, meta: AudioEventMeta & Record<string, unknown>) {
  gaEvent(name, meta);
}

