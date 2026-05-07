"use client";

import Link from "next/link";
import type { ShowListEntry } from "@/lib/show-search";
import { OptimizedCover } from "./OptimizedCover";
import { ShowFavoriteHeart } from "./ShowFavoriteHeart";

const DEFAULT_CARD_SIZES = "(max-width: 639px) 48vw, (max-width: 1100px) 28vw, 300px";

/** Slightly lower than hero art — smaller files for dense grids; next/image still picks width from `sizes`. */
const CARD_COVER_QUALITY = 72;

export function ShowCard({
  show,
  imageSizes,
  imageQuality = CARD_COVER_QUALITY,
}: {
  show: ShowListEntry;
  imageSizes?: string;
  /** next/image quality; default tuned for list grids */
  imageQuality?: number;
}) {
  const cover = show.cover_image;
  const href = `/shows/${show.slug}`;
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[’']/g, "'")
      .replace(/[\s\-—–]+/g, " ")
      .replace(/[^\p{L}\p{N}\s']/gu, "")
      .trim();
  const desc = (show.description ?? "").trim();
  const showDesc = desc && normalize(desc) !== normalize(show.title) ? desc : "";

  return (
    <article className="card">
      <div className="card__media">
        <Link
          href={href}
          className="card__cover-link"
          tabIndex={-1}
          aria-hidden="true"
          draggable={false}
        >
          {cover ? (
            <OptimizedCover
              src={cover}
              alt=""
              width={300}
              height={300}
              sizes={imageSizes ?? DEFAULT_CARD_SIZES}
              quality={imageQuality}
            />
          ) : (
            <div className="card__media--placeholder card__media--placeholder--fill" aria-hidden />
          )}
        </Link>
        <ShowFavoriteHeart slug={show.slug} showTitle={show.title} />
      </div>
      <Link href={href} className="card__link">
        <div className="card__body">
          <h2 className="card__title">{show.title}</h2>
          {showDesc ? <p className="card__excerpt">{showDesc}</p> : null}
        </div>
      </Link>
    </article>
  );
}
