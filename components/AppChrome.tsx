"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useId, useState } from "react";
import { HeaderSearch, HeaderSearchFallback } from "./HeaderSearch";
import { SiteFooter } from "./SiteFooter";
import { ThemeToggle } from "./ThemeToggle";

export type NavCategory = { slug: string; title: string; count: number };

const topNav = [{ href: "/shows", label: "All shows" }];

type Props = {
  categories: NavCategory[];
  children: React.ReactNode;
};

export function AppChrome({ categories, children }: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const close = useCallback(() => setOpen(false), []);

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

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <div className="site-header__start">
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
            <Link href="/" className="site-header__home-btn site-header__home-btn--mobile" aria-label="Home">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5 9.9V21h14V9.9" />
              </svg>
            </Link>
            <nav className="site-header__rail" aria-label="Library">
              <Link href="/recent">Recently listened</Link>
              <Link href="/favorites">Favorites</Link>
            </nav>
          </div>
          <div className="site-header__center">
            <Link href="/" className="site-header__home-btn site-header__home-btn--desktop" aria-label="Home">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5 9.9V21h14V9.9" />
              </svg>
            </Link>
            <Suspense fallback={<HeaderSearchFallback />}>
              <HeaderSearch />
            </Suspense>
          </div>
          <div className="site-header__end">
            <ThemeToggle />
            <nav className="site-nav" aria-label="Primary">
              {topNav.map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
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
        <div className="nav-drawer__scroll">
          <nav className="nav-drawer__list" aria-label="Site">
            <Link href="/recent" className="nav-drawer__link" onClick={close}>
              Recently listened
            </Link>
            <Link href="/favorites" className="nav-drawer__link" onClick={close}>
              Favorites
            </Link>
            <Link href="/" className="nav-drawer__link" onClick={close}>
              Home
            </Link>
            <Link href="/blog" className="nav-drawer__link" onClick={close}>
              Blog
            </Link>
            <Link href="/author" className="nav-drawer__link" onClick={close}>
              Authors
            </Link>
            <Link href="/radio-shows" className="nav-drawer__link" onClick={close}>
              Radio shows
            </Link>
            <div className="nav-drawer__rule" aria-hidden />
            {categories.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="nav-drawer__link" onClick={close}>
                <span className="nav-drawer__link-text">{c.title}</span>
                <span className="nav-drawer__count" aria-label={`${c.count} shows`}>
                  {c.count}
                </span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="nav-drawer__footer">
          <Link href="/category" className="nav-drawer__all" onClick={close}>
            All categories
          </Link>
        </div>
      </aside>

      <main className="site-main">{children}</main>
      <SiteFooter />
    </>
  );
}
