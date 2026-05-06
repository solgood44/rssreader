import Link from "next/link";
import type { ShowRecord } from "@/lib/content";
import { OptimizedCover } from "./OptimizedCover";

export function ShowCard({ show }: { show: ShowRecord }) {
  const cover = show.data.cover_image;
  return (
    <article className="card">
      <Link href={`/shows/${show.slug}`} className="card__link">
        {cover ? (
          <div className="card__media">
            <OptimizedCover src={cover} alt="" size={280} />
          </div>
        ) : (
          <div className="card__media card__media--placeholder" aria-hidden />
        )}
        <div className="card__body">
          <h2 className="card__title">{show.data.title}</h2>
          {show.data.description ? <p className="card__excerpt">{show.data.description}</p> : null}
        </div>
      </Link>
    </article>
  );
}
