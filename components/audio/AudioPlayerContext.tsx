"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getListenRecord, saveListenRecord } from "@/lib/listen-progress-storage";
import { gaAudioEvent } from "@/lib/analytics";

const VOLUME_KEY = "rssreader_volume_v1";
const SAVE_PROGRESS_MS = 2000;

export type TrackMeta = {
  url: string;
  title: string;
  artwork?: string;
  showTitle?: string;
  showSlug?: string;
  episodeId?: string;
};

type SleepMode = "off" | "timer" | "end";

type Ctx = {
  current: TrackMeta | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loadAndPlay: (t: TrackMeta) => void;
  togglePlay: () => void;
  pause: () => void;
  seekFraction: (f: number) => void;
  skip: (deltaSec: number) => void;
  setVolume: (v: number) => void;
  sleepMode: SleepMode;
  sleepEndAt: number | null;
  sleepLabel: string;
  setSleepTimerMinutes: (minutes: number | null) => void;
  setSleepEndOfEpisode: () => void;
  clearSleepTimer: () => void;
};

const AudioPlayerContext = createContext<Ctx | null>(null);

export function useAudioPlayer() {
  const c = useContext(AudioPlayerContext);
  if (!c) throw new Error("useAudioPlayer requires AudioPlayerProvider");
  return c;
}

function toAbsoluteArtworkUrl(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (typeof window === "undefined") return undefined;
  const s = src.trim();
  if (s.startsWith("https://")) return s;
  if (s.startsWith("http://")) return s;
  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("/")) return `${window.location.origin}${s}`;
  return `${window.location.origin}/${s}`;
}

function formatSleepLeft(endAt: number): string {
  const s = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return m > 0 ? `${m}:${r.toString().padStart(2, "0")}` : `${r}s`;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentRef = useRef<TrackMeta | null>(null);
  const volumeRef = useRef(1);
  const lastProgressSave = useRef(0);
  const sleepModeRef = useRef<SleepMode>("off");
  const lastSeekFrom = useRef<number | null>(null);
  const milestonesRef = useRef<Map<string, Set<number>>>(new Map());

  const [current, setCurrent] = useState<TrackMeta | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [sleepMode, setSleepMode] = useState<SleepMode>("off");
  const [sleepEndAt, setSleepEndAt] = useState<number | null>(null);
  const [sleepLabel, setSleepLabel] = useState("");

  currentRef.current = current;
  volumeRef.current = volume;
  sleepModeRef.current = sleepMode;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VOLUME_KEY);
      if (raw == null) return;
      const v = parseFloat(raw);
      if (v >= 0 && v <= 1) {
        setVolumeState(v);
        volumeRef.current = v;
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volume;
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      /* ignore */
    }
  }, [volume]);

  const setVolume = useCallback((v: number) => {
    const n = Math.min(1, Math.max(0, v));
    setVolumeState(n);
    volumeRef.current = n;
  }, []);

  const clearSleepTimer = useCallback(() => {
    setSleepMode("off");
    sleepModeRef.current = "off";
    setSleepEndAt(null);
    setSleepLabel("");
  }, []);

  const flushProgress = useCallback(() => {
    const a = audioRef.current;
    const url = currentRef.current?.url;
    if (!a || !url || !a.duration || !isFinite(a.duration)) return;
    const frac = Math.min(1, a.currentTime / a.duration);
    saveListenRecord(url, frac >= 0.97 ? 1 : frac, frac >= 0.97);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => {
      setIsPlaying(true);
      const t = currentRef.current;
      if (t) {
        gaAudioEvent("audio_play", {
          audio_url: t.url,
          episode_title: t.title,
          episode_id: t.episodeId,
          show_title: t.showTitle,
          show_slug: t.showSlug,
        });
      }
    };
    const onPause = () => {
      setIsPlaying(false);
      flushProgress();
      const t = currentRef.current;
      if (t) {
        gaAudioEvent("audio_pause", {
          audio_url: t.url,
          episode_title: t.title,
          episode_id: t.episodeId,
          show_title: t.showTitle,
          show_slug: t.showSlug,
          position_sec: audio.currentTime,
          duration_sec: audio.duration,
        });
      }
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const d = audio.duration;
      if (d && isFinite(d)) setDuration(d);
      const url = currentRef.current?.url;
      if (!url || !d || !isFinite(d)) return;
      const now = Date.now();
      if (now - lastProgressSave.current >= SAVE_PROGRESS_MS) {
        lastProgressSave.current = now;
        const frac = Math.min(1, audio.currentTime / d);
        saveListenRecord(url, frac >= 0.97 ? 1 : frac, frac >= 0.97);
      }

      // Milestone analytics (fire once per track at 25/50/75/90%).
      const t = currentRef.current;
      if (!t) return;
      const pct = (audio.currentTime / d) * 100;
      const marks = [25, 50, 75, 90];
      let set = milestonesRef.current.get(t.url);
      if (!set) {
        set = new Set<number>();
        milestonesRef.current.set(t.url, set);
      }
      for (const m of marks) {
        if (pct >= m && !set.has(m)) {
          set.add(m);
          gaAudioEvent("audio_progress", {
            audio_url: t.url,
            episode_title: t.title,
            episode_id: t.episodeId,
            show_title: t.showTitle,
            show_slug: t.showSlug,
            progress_percent: m,
            position_sec: audio.currentTime,
            duration_sec: d,
          });
        }
      }
    };
    const onLoadedMeta = () => {
      const d = audio.duration;
      if (d && isFinite(d)) setDuration(d);
    };
    const onEnded = () => {
      setIsPlaying(false);
      const url = currentRef.current?.url;
      if (url) saveListenRecord(url, 1, true);
      const t = currentRef.current;
      if (t) {
        gaAudioEvent("audio_complete", {
          audio_url: t.url,
          episode_title: t.title,
          episode_id: t.episodeId,
          show_title: t.showTitle,
          show_slug: t.showSlug,
          duration_sec: audio.duration,
        });
      }
      if (sleepModeRef.current === "end") clearSleepTimer();
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMeta);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, [flushProgress, clearSleepTimer]);

  const loadAndPlay = useCallback((t: TrackMeta) => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrent(t);
    currentRef.current = t;
    milestonesRef.current.set(t.url, new Set());
    audio.volume = volumeRef.current;
    audio.src = t.url;

    const rec = getListenRecord(t.url);
    const onMeta = () => {
      if (rec && !rec.completed && rec.progress > 0.04 && rec.progress < 0.96 && audio.duration && isFinite(audio.duration)) {
        audio.currentTime = rec.progress * audio.duration;
      }
      setDuration(audio.duration || 0);
    };
    audio.addEventListener("loadedmetadata", onMeta, { once: true });

    void audio.play().catch(() => {});

    gaAudioEvent("audio_start", {
      audio_url: t.url,
      episode_title: t.title,
      episode_id: t.episodeId,
      show_title: t.showTitle,
      show_slug: t.showSlug,
    });
  }, []);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a?.src) return;
    if (a.paused) void a.play().catch(() => {});
    else a.pause();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seekFraction = useCallback((f: number) => {
    const a = audioRef.current;
    if (!a?.duration || !isFinite(a.duration)) return;
    lastSeekFrom.current = a.currentTime;
    a.currentTime = Math.min(a.duration, Math.max(0, f * a.duration));
    const t = currentRef.current;
    if (t) {
      gaAudioEvent("audio_seek", {
        audio_url: t.url,
        episode_title: t.title,
        episode_id: t.episodeId,
        show_title: t.showTitle,
        show_slug: t.showSlug,
        from_sec: lastSeekFrom.current,
        to_sec: a.currentTime,
        method: "scrub",
      });
    }
  }, []);

  const skip = useCallback((deltaSec: number) => {
    const a = audioRef.current;
    if (!a) return;
    const from = a.currentTime;
    const d = a.duration;
    const maxT = d && isFinite(d) ? d : Infinity;
    a.currentTime = Math.max(0, Math.min(maxT, a.currentTime + deltaSec));
    const t = currentRef.current;
    if (t) {
      gaAudioEvent("audio_seek", {
        audio_url: t.url,
        episode_title: t.title,
        episode_id: t.episodeId,
        show_title: t.showTitle,
        show_slug: t.showSlug,
        from_sec: from,
        to_sec: a.currentTime,
        method: "skip",
        delta_sec: deltaSec,
      });
    }
  }, []);

  const setSleepTimerMinutes = useCallback(
    (minutes: number | null) => {
      if (minutes == null || minutes <= 0) {
        clearSleepTimer();
        return;
      }
      setSleepMode("timer");
      sleepModeRef.current = "timer";
      const end = Date.now() + minutes * 60 * 1000;
      setSleepEndAt(end);
      setSleepLabel(formatSleepLeft(end));
    },
    [clearSleepTimer],
  );

  const setSleepEndOfEpisode = useCallback(() => {
    setSleepMode("end");
    sleepModeRef.current = "end";
    setSleepEndAt(null);
    setSleepLabel("Until episode ends");
  }, []);

  useEffect(() => {
    if (sleepMode !== "timer" || !sleepEndAt) return;
    const id = setInterval(() => {
      if (Date.now() >= sleepEndAt) {
        audioRef.current?.pause();
        clearSleepTimer();
        return;
      }
      setSleepLabel(formatSleepLeft(sleepEndAt));
    }, 500);
    return () => clearInterval(id);
  }, [sleepMode, sleepEndAt, clearSleepTimer]);

  useEffect(() => {
    document.body.classList.toggle("has-audio-dock", !!current);
  }, [current]);

  /** Lock screen / Control Center metadata (cover art needs absolute https URLs). */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!current) {
      navigator.mediaSession.metadata = null;
      return;
    }
    const absArt = toAbsoluteArtworkUrl(current.artwork);
    const artwork = absArt ? [{ src: absArt, sizes: "512x512" }] : [];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.showTitle || "Sol Good Media",
      album: current.showTitle || undefined,
      artwork,
    });
  }, [current]);

  const lastReportedPos = useRef(0);
  useEffect(() => {
    lastReportedPos.current = -1;
  }, [current?.url]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    if (!("setPositionState" in ms)) return;
    if (!current || !duration || !isFinite(duration) || duration <= 0) {
      return;
    }
    const pos = Math.min(duration, Math.max(0, currentTime));
    if (isPlaying && Math.abs(pos - lastReportedPos.current) < 0.45) return;
    lastReportedPos.current = pos;
    try {
      ms.setPositionState({
        duration,
        playbackRate: 1,
        position: pos,
      });
    } catch {
      /* iOS/Safari: invalid state */
    }
  }, [current, currentTime, duration, isPlaying]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const audio = audioRef.current;
    const play = () => {
      void audio?.play().catch(() => {});
    };
    const pause = () => audio?.pause();
    try {
      ms.setActionHandler("play", play);
      ms.setActionHandler("pause", pause);
      ms.setActionHandler("seekbackward", () => {
        const a = audioRef.current;
        if (!a) return;
        a.currentTime = Math.max(0, a.currentTime - 10);
      });
      ms.setActionHandler("seekforward", () => {
        const a = audioRef.current;
        if (!a) return;
        const d = a.duration;
        const maxT = d && isFinite(d) ? d : Infinity;
        a.currentTime = Math.min(maxT, a.currentTime + 30);
      });
    } catch {
      /* unsupported */
    }
    return () => {
      try {
        ms.setActionHandler("play", null);
        ms.setActionHandler("pause", null);
        ms.setActionHandler("seekbackward", null);
        ms.setActionHandler("seekforward", null);
      } catch {
        /* ignore */
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      current,
      isPlaying,
      currentTime,
      duration,
      volume,
      loadAndPlay,
      togglePlay,
      pause,
      seekFraction,
      skip,
      setVolume,
      sleepMode,
      sleepEndAt,
      sleepLabel,
      setSleepTimerMinutes,
      setSleepEndOfEpisode,
      clearSleepTimer,
    }),
    [
      current,
      isPlaying,
      currentTime,
      duration,
      volume,
      loadAndPlay,
      togglePlay,
      pause,
      seekFraction,
      skip,
      setVolume,
      sleepMode,
      sleepEndAt,
      sleepLabel,
      setSleepTimerMinutes,
      setSleepEndOfEpisode,
      clearSleepTimer,
    ],
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" playsInline className="audio-global-ref" />
    </AudioPlayerContext.Provider>
  );
}
