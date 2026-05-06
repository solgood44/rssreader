"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ShowListEntry } from "@/lib/show-search";
import { suggestionShows } from "@/lib/show-search";

export type NavCategory = { slug: string; title: string };

const topNav = [{ href: "/shows", label: "All shows" }];

type Props = {
  categories: NavCategory[];
  showEntries: ShowListEntry[];
  children: React.ReactNode;
};

export function AppChrome({ categories, showEntries, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const searchId = useId();
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const [searchInput, setSearchInput] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  const suggestions = useMemo(
    () => (searchInput.trim() ? suggestionShows(showEntries, searchInput, 8) : []),
    [showEntries, searchInput],
  );

  useEffect(() => {
    document.body.classList.toggle("nav-drawer-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.classList.remove("nav-drawer-open");
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

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
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <div className="site-header__left">
            <button
              type="button"
              className={`nav-hamburger${open ? " nav-hamburger--open" : ""}`}
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="site-nav-drawer"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span className="nav-hamburger__bar" aria-hidden />
              <span className="nav-hamburger__bar" aria-hidden />
              <span className="nav-hamburger__bar" aria-hidden />
            </button>
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
                      <button
                        type="button"
                        className="shows-search-suggest__btn"
                        onClick={() => onPickShow(s.slug)}
                      >
                        <span className="shows-search-suggest__title">{s.title}</span>
                        {s.categories.length > 0 ? (
                          <span className="shows-search-suggest__meta">
                            {s.categories.slice(0, 3).join(" · ")}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          <nav className="site-nav" aria-label="Primary">
            {topNav.map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div
        className={`nav-drawer-overlay${open ? " is-visible" : ""}`}
        aria-hidden={!open}
        onClick={close}
      />

      <aside
        id="site-nav-drawer"
        className={`nav-drawer${open ? " is-open" : ""}`}
        aria-labelledby={titleId}
        role="dialog"
        aria-modal="true"
        inert={!open}
      >
        <div className="nav-drawer__head">
          <h2 id={titleId} className="nav-drawer__title">
            Menu
          </h2>
          <button type="button" className="nav-drawer__close" onClick={close} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="nav-drawer__list" aria-label="Site">
          <Link href="/" className="nav-drawer__link" onClick={close}>
            Home
          </Link>
          <Link href="/blog" className="nav-drawer__link" onClick={close}>
            Blog
          </Link>
          <div className="nav-drawer__rule" aria-hidden />
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="nav-drawer__link" onClick={close}>
              {c.title}
            </Link>
          ))}
        </nav>
        <div className="nav-drawer__footer">
          <Link href="/category" className="nav-drawer__all" onClick={close}>
            All categories
          </Link>
        </div>
      </aside>

      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <p>Podcast network and audio library. Audio streams from Spreaker; nothing is re-hosted here.</p>
      </footer>
    </>
  );
}
