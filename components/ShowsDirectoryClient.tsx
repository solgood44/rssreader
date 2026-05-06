"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterShows, sortEntries, suggestionShows, type ShowListEntry, type SortMode } from "@/lib/show-search";
import { ShowCard } from "./ShowCard";

const PAGE_SIZE = 48;
const DEBOUNCE_MS = 320;

function parseSort(s: string | null): SortMode {
  if (s === "za" || s === "random") return s;
  return "az";
}

export function ShowsDirectoryClient({ entries }: { entries: ShowListEntry[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const sort = parseSort(searchParams.get("sort"));
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const seedStr = searchParams.get("seed");
  const randomSeed =
    seedStr != null && seedStr !== "" ? parseInt(seedStr, 10) || 1337 : 1337;

  const [input, setInput] = useState(q);
  const [suggestOpen, setSuggestOpen] = useState(false);

  useEffect(() => {
    setInput(q);
  }, [q]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (input.trim() === q) return;
      const p = new URLSearchParams(searchParams.toString());
      const next = input.trim();
      if (!next) p.delete("q");
      else p.set("q", next);
      p.delete("page");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input, q, pathname, router, searchParams]);

  useEffect(() => {
    if (!suggestOpen) return;
    const close = (e: MouseEvent) => {
      if (searchWrapRef.current?.contains(e.target as Node)) return;
      setSuggestOpen(false);
    };
    const id = window.setTimeout(() => document.addEventListener("click", close), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", close);
    };
  }, [suggestOpen]);

  const filtered = useMemo(() => filterShows(entries, q), [entries, q]);
  const sorted = useMemo(
    () => sortEntries(filtered, sort, randomSeed),
    [filtered, sort, randomSeed],
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const slice = sorted.slice(start, start + PAGE_SIZE);

  const suggestions = useMemo(
    () => (input.trim().length > 0 ? suggestionShows(entries, input, 10) : []),
    [entries, input],
  );

  const pushParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      mutate(p);
      const qs = p.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const setSort = (mode: SortMode) => {
    pushParams((p) => {
      if (mode === "az") {
        p.delete("sort");
        p.delete("seed");
      } else {
        p.set("sort", mode);
        if (mode === "random") p.set("seed", String(Date.now() & 0x7fffffff));
        else p.delete("seed");
      }
      p.delete("page");
    });
  };

  const setPage = (n: number) => {
    pushParams((p) => {
      if (n <= 1) p.delete("page");
      else p.set("page", String(n));
    });
  };

  const onPickSuggestion = (slug: string) => {
    setSuggestOpen(false);
    router.push(`/shows/${slug}`);
  };

  return (
    <div>
      <h1 className="hero__title">All shows</h1>
      <p className="hero__lede">
        {sorted.length === entries.length
          ? `${entries.length} shows`
          : `${sorted.length} matching · ${entries.length} total`}
        {totalPages > 1 ? ` · page ${safePage} of ${totalPages}` : null}
      </p>

      <div className="shows-toolbar">
        <div className="shows-toolbar__sort" role="group" aria-label="Sort shows">
          <span className="shows-toolbar__label">Sort</span>
          <button
            type="button"
            className={`shows-sort-btn${sort === "az" ? " is-active" : ""}`}
            onClick={() => setSort("az")}
          >
            A–Z
          </button>
          <button
            type="button"
            className={`shows-sort-btn${sort === "za" ? " is-active" : ""}`}
            onClick={() => setSort("za")}
          >
            Z–A
          </button>
          <button
            type="button"
            className={`shows-sort-btn${sort === "random" ? " is-active" : ""}`}
            onClick={() => setSort("random")}
          >
            Random
          </button>
        </div>

        <div className="shows-search-wrap" ref={searchWrapRef}>
          <label className="visually-hidden" htmlFor="shows-search-input">
            Search podcasts by title, description, or category
          </label>
          <input
            id="shows-search-input"
            type="search"
            className="shows-search-input"
            placeholder="Search shows…"
            autoComplete="off"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSuggestOpen(true);
            }}
            onFocus={() => setSuggestOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSuggestOpen(false);
              if (e.key === "Enter" && suggestions[0]) {
                e.preventDefault();
                onPickSuggestion(suggestions[0].slug);
              }
            }}
            role="combobox"
            aria-expanded={suggestOpen && suggestions.length > 0}
            aria-controls="shows-search-suggest"
            aria-autocomplete="list"
          />
          {suggestOpen && suggestions.length > 0 ? (
            <ul id="shows-search-suggest" className="shows-search-suggest" role="listbox">
              {suggestions.map((s) => (
                <li key={s.slug} role="option">
                  <button type="button" className="shows-search-suggest__btn" onClick={() => onPickSuggestion(s.slug)}>
                    <span className="shows-search-suggest__title">{s.title}</span>
                    {s.categories.length ? (
                      <span className="shows-search-suggest__meta">{s.categories.slice(0, 3).join(" · ")}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {slice.length === 0 ? (
        <p className="section-sub">No shows match “{q}”. Try another search or clear the filter.</p>
      ) : (
        <div className="card-grid">
          {slice.map((s) => (
            <ShowCard key={s.slug} show={s} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="pager-bar">
          {safePage > 1 ? (
            <button type="button" className="pager-link" onClick={() => setPage(safePage - 1)}>
              ← Previous
            </button>
          ) : (
            <span />
          )}
          {safePage < totalPages ? (
            <button type="button" className="pager-link" onClick={() => setPage(safePage + 1)}>
              Next →
            </button>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}
