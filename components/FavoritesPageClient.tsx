"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShowCard } from "@/components/ShowCard";
import {
  FAVORITES_STORAGE_KEY,
  FAVORITES_UPDATED_EVENT,
  getFavoriteSlugs,
  setFavoriteSlugs,
} from "@/lib/favorite-shows-storage";
import type { ShowListEntry } from "@/lib/show-search";

function reorderSlugs(list: string[], fromSlug: string, toSlug: string): string[] {
  const fromIdx = list.indexOf(fromSlug);
  const toIdx = list.indexOf(toSlug);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return list;
  const next = [...list];
  const [item] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, item);
  return next;
}

type Props = {
  allEntries: ShowListEntry[];
};

export function FavoritesPageClient({ allEntries }: Props) {
  const bySlug = useMemo(() => {
    const m = new Map<string, ShowListEntry>();
    for (const e of allEntries) m.set(e.slug, e);
    return m;
  }, [allEntries]);

  const [slugs, setSlugs] = useState<string[] | null>(null);
  const [draggingSlug, setDraggingSlug] = useState<string | null>(null);
  const [dropTargetSlug, setDropTargetSlug] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSlugs(getFavoriteSlugs());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_STORAGE_KEY || e.key === null) refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener(FAVORITES_UPDATED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, onCustom);
    };
  }, [refresh]);

  if (slugs === null) {
    return (
      <div className="favorites-page">
        <h1 className="hero__title">Favorites</h1>
        <p className="hero__lede" style={{ color: "var(--muted)" }}>
          Loading…
        </p>
      </div>
    );
  }

  const entries = slugs.map((s) => bySlug.get(s)).filter((e): e is ShowListEntry => e != null);

  if (entries.length === 0) {
    return (
      <div className="favorites-page">
        <h1 className="hero__title">Favorites</h1>
        <p className="hero__lede">
          Shows you heart appear here. Open any podcast and tap the heart on the cover. Favorites stay on this device
          only.
        </p>
        <p className="section-sub">
          <Link href="/shows">Browse all shows</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <h1 className="hero__title">Favorites</h1>
      <p className="hero__lede">
        {entries.length} show{entries.length === 1 ? "" : "s"} saved in this browser.{" "}
        <Link href="/shows">Directory</Link>
        {" · "}
        <span className="favorites-page__dnd-hint">Drag tiles to reorder (desktop browsers).</span>
      </p>
      <div className="favorites-grid">
        {entries.map((show) => (
          <div
            key={show.slug}
            className={
              "favorites-grid__item" +
              (draggingSlug === show.slug ? " favorites-grid__item--dragging" : "") +
              (dropTargetSlug === show.slug && draggingSlug !== show.slug
                ? " favorites-grid__item--over"
                : "")
            }
            draggable
            onDragStart={(e) => {
              setDraggingSlug(show.slug);
              e.dataTransfer.setData("text/plain", show.slug);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => {
              setDraggingSlug(null);
              setDropTargetSlug(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (draggingSlug && draggingSlug !== show.slug) setDropTargetSlug(show.slug);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const from = e.dataTransfer.getData("text/plain") || draggingSlug;
              if (!from || from === show.slug || !slugs) return;
              const next = reorderSlugs(slugs, from, show.slug);
              setFavoriteSlugs(next);
              setSlugs(next);
              setDraggingSlug(null);
              setDropTargetSlug(null);
            }}
          >
            <ShowCard show={show} imageSizes="(max-width: 720px) 32vw, 260px" />
          </div>
        ))}
      </div>
    </div>
  );
}
