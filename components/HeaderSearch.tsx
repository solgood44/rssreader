"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ShowListEntry } from "@/lib/show-search";

const SEARCH_DEBOUNCE_MS = 280;

export function HeaderSearchFallback() {
  return (
    <div className="site-header__search-wrap">
      <div className="site-header__search-input site-header__search-input--fallback" aria-hidden>
        Search shows…
      </div>
    </div>
  );
}

export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const searchId = useId();
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<ShowListEntry[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const qOnShowsPage = pathname === "/shows" ? (urlSearchParams.get("q") ?? "").trim() : "";

  useEffect(() => {
    if (pathname === "/shows") setSearchInput(qOnShowsPage);
    else setSearchInput("");
  }, [pathname, qOnShowsPage]);

  useEffect(() => {
    const q = searchInput.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (!q) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const ac = new AbortController();
      abortRef.current = ac;
      void (async () => {
        try {
          const res = await fetch(`/api/shows/search?q=${encodeURIComponent(q)}`, { signal: ac.signal });
          if (!res.ok) return;
          const data = (await res.json()) as { results?: ShowListEntry[] };
          setSuggestions(Array.isArray(data.results) ? data.results : []);
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return;
        }
      })();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [searchInput]);

  useEffect(() => {
    if (!suggestOpen) return;
    const closeSuggest = (e: MouseEvent) => {
      if (searchWrapRef.current?.contains(e.target as Node)) return;
      setSuggestOpen(false);
    };
    const id = window.setTimeout(() => document.addEventListener("click", closeSuggest), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", closeSuggest);
    };
  }, [suggestOpen]);

  const goSearch = useCallback(() => {
    const q = searchInput.trim();
    setSuggestOpen(false);
    if (!q) {
      router.push("/shows");
      return;
    }
    router.push(`/shows?q=${encodeURIComponent(q)}`);
  }, [router, searchInput]);

  const onPickShow = useCallback(
    (slug: string) => {
      setSuggestOpen(false);
      setSearchInput("");
      router.push(`/shows/${slug}`);
    },
    [router],
  );

  return (
    <div className="site-header__search-wrap" ref={searchWrapRef}>
      <label className="visually-hidden" htmlFor={searchId}>
        Search shows
      </label>
      <input
        id={searchId}
        type="search"
        className="site-header__search-input"
        placeholder="Search shows…"
        autoComplete="off"
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value);
          setSuggestOpen(true);
        }}
        onFocus={() => setSuggestOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            goSearch();
          }
          if (e.key === "Escape") setSuggestOpen(false);
        }}
        aria-expanded={suggestOpen && suggestions.length > 0}
        aria-controls="site-header-search-suggest"
        aria-autocomplete="list"
      />
      {suggestOpen && suggestions.length > 0 ? (
        <ul id="site-header-search-suggest" className="site-header__search-suggest" role="listbox">
          {suggestions.map((s) => (
            <li key={s.slug} role="option">
              <button type="button" className="shows-search-suggest__btn" onClick={() => onPickShow(s.slug)}>
                <span className="shows-search-suggest__title">{s.title}</span>
                {s.categories.length > 0 ? (
                  <span className="shows-search-suggest__meta">{s.categories.slice(0, 3).join(" · ")}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
