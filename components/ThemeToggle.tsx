"use client";

import { useCallback, useLayoutEffect, useState } from "react";

export const THEME_STORAGE_KEY = "sgm-theme";

export function applyTheme(mode: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", mode);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* private mode */
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<"light" | "dark">("dark");

  useLayoutEffect(() => {
    const t = document.documentElement.getAttribute("data-theme");
    setMode(t === "light" ? "light" : "dark");
  }, []);

  const toggle = useCallback(() => {
    setMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, []);

  const isDark = mode === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={!isDark}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
