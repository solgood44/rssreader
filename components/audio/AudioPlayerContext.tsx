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

const VOLUME_KEY = "rssreader_volume_v1";
const SAVE_PROGRESS_MS = 2000;

export type TrackMeta = {
  url: string;
  title: string;
  artwork?: string;
  showTitle?: string;
  showSlug?: string;
};

type SleepMode = "off" | "timer" | "end";

type Ctx = {
  current: TrackMeta | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  dockExpanded: boolean;
  setDockExpanded: (v: boolean) => void;
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

  const [current, setCurrent] = useState<TrackMeta | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [dockExpanded, setDockExpanded] = useState(false);
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

    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      flushProgress();
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
    };
    const onLoadedMeta = () => {
      const d = audio.duration;
      if (d && isFinite(d)) setDuration(d);
    };
    const onEnded = () => {
      setIsPlaying(false);
      const url = currentRef.current?.url;
      if (url) saveListenRecord(url, 1, true);
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
    a.currentTime = Math.min(a.duration, Math.max(0, f * a.duration));
  }, []);

  const skip = useCallback((deltaSec: number) => {
    const a = audioRef.current;
    if (!a) return;
    const d = a.duration;
    const maxT = d && isFinite(d) ? d : Infinity;
    a.currentTime = Math.max(0, Math.min(maxT, a.currentTime + deltaSec));
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

  const value = useMemo(
    () => ({
      current,
      isPlaying,
      currentTime,
      duration,
      volume,
      dockExpanded,
      setDockExpanded,
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
      dockExpanded,
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
