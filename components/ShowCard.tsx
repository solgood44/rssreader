import Link from "next/link";
import type { ShowListEntry } from "@/lib/show-search";
import { OptimizedCover } from "./OptimizedCover";

export function ShowCard({ show }: { show: ShowListEntry }) {
  const cover = show.cover_image;
  return (
    <article className="card">
      <Link href={`/shows/${show.slug}`} className="card__link">
        {cover ? (
          <div className="card__media">
            <OptimizedCover
              src={cover}
              alt=""
              width={300}
              height={300}
              sizes="(max-width: 639px) 48vw, (max-width: 1100px) 28vw, 300px"
            />
          </div>
        ) : (
          <div className="card__media card__media--placeholder" aria-hidden />
        )}
        <div className="card__body">
          <h2 className="card__title">{show.title}</h2>
          {show.description ? <p className="card__excerpt">{show.description}</p> : null}
        </div>
      </Link>
    </article>
  );
}
