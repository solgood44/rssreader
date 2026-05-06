"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FAVORITES_STORAGE_KEY,
  FAVORITES_UPDATED_EVENT,
  isFavoriteSlug,
  toggleFavoriteSlug,
} from "@/lib/favorite-shows-storage";

type Props = {
  slug: string;
  showTitle: string;
};

export function ShowFavoriteHeart({ slug, showTitle }: Props) {
  const [on, setOn] = useState(false);

  const sync = useCallback(() => {
    setOn(isFavoriteSlug(slug));
  }, [slug]);

  useEffect(() => {
    sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_STORAGE_KEY || e.key === null) sync();
    };
    const onCustom = () => sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener(FAVORITES_UPDATED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, onCustom);
    };
  }, [sync]);

  const label = on ? `Remove “${showTitle}” from favorites` : `Add “${showTitle}” to favorites`;

  return (
    <button
      type="button"
      className={`show-favorite-heart${on ? " show-favorite-heart--on" : ""}`}
      onClick={() => setOn(toggleFavoriteSlug(slug))}
      aria-label={label}
      aria-pressed={on}
      title={on ? "Remove from favorites" : "Add to favorites"}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2Z"
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
