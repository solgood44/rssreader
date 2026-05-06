import Link from "next/link";
import type { RssEpisode } from "@/lib/rss";
import type { ShowRecord } from "@/lib/content";
import { compositeEpisodeSlug } from "@/lib/episodes";
import { OptimizedCover } from "./OptimizedCover";

const EPISODES_PAGE_SIZE = 40;

type Props = {
  show: ShowRecord;
  episodes: RssEpisode[];
  page?: number;
};

export function EpisodeList({ show, episodes, page = 1 }: Props) {
  const sorted = [...episodes].sort((a, b) => {
    const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
    const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
    return tb - ta;
  });
  const start = (page - 1) * EPISODES_PAGE_SIZE;
  const slice = sorted.slice(start, start + EPISODES_PAGE_SIZE);
  const hasMore = start + EPISODES_PAGE_SIZE < sorted.length;

  return (
    <>
      <ol className="episode-list">
        {slice.map((ep) => {
          const href = `/episode/${compositeEpisodeSlug(show.slug, ep.id)}`;
          const thumb = ep.image || show.data.cover_image;
          return (
            <li key={ep.id} className="episode-list__item">
              {thumb ? (
                <Link href={href} className="episode-list__thumb" aria-hidden>
                  <OptimizedCover src={thumb} alt="" size={72} />
                </Link>
              ) : null}
              <div className="episode-list__text">
                <Link href={href} className="episode-list__title">
                  {ep.title}
                </Link>
                {ep.pubDate ? (
                  <time className="episode-list__date" dateTime={ep.pubDate}>
                    {new Date(ep.pubDate).toLocaleDateString()}
                  </time>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      {hasMore ? (
        <p className="pager">
          <Link href={`/shows/${show.slug}?page=${page + 1}`} className="pager__link">
            Load more episodes →
          </Link>
        </p>
      ) : null}
    </>
  );
}
