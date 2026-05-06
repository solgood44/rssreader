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
              aria-label={open ? "Close menu" : "Open topics menu"}
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
            Topics
          </h2>
          <button type="button" className="nav-drawer__close" onClick={close} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="nav-drawer__list" aria-label="Browse by topic">
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
