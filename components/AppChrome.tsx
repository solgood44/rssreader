"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

export type NavCategory = { slug: string; title: string };

const topNav = [
  { href: "/shows", label: "All shows" },
  { href: "/blog", label: "Blog" },
];

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
          <div className="site-header__left">
            <button
              type="button"
              className={`nav-hamburger${open ? " nav-hamburger--open" : ""}`}
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="site-nav-drawer"
              aria-label={open ? "Close categories menu" : "Open categories menu"}
            >
              <span className="nav-hamburger__bar" aria-hidden />
              <span className="nav-hamburger__bar" aria-hidden />
              <span className="nav-hamburger__bar" aria-hidden />
            </button>
            <Link href="/" className="site-logo">
              Sol Good Media
            </Link>
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
            Categories
          </h2>
          <button type="button" className="nav-drawer__close" onClick={close} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="nav-drawer__lede">Browse shows by topic — same tags as the original site.</p>
        <nav className="nav-drawer__list" aria-label="Categories">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="nav-drawer__link" onClick={close}>
              <span className="nav-drawer__link-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
                </svg>
              </span>
              <span className="nav-drawer__link-text">{c.title}</span>
              <span className="nav-drawer__chev" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          ))}
        </nav>
        <div className="nav-drawer__footer">
          <Link href="/category" className="nav-drawer__all" onClick={close}>
            View all categories →
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
