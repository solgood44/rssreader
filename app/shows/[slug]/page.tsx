import Link from "next/link";
import { notFound } from "next/navigation";
import { getShow } from "@/lib/content";
import { getShowListEntriesCached } from "@/lib/show-list-cache";
import { recommendedShowEntries, shouldShowShowDescription } from "@/lib/show-search";
import { fetchRssEpisodes } from "@/lib/rss";
import { detectNumberedEpisodes, resolveEpisodeSort } from "@/lib/episode-sort";
import { EpisodeList } from "@/components/EpisodeList";
import { Markdown } from "@/components/Markdown";
import { OptimizedCover } from "@/components/OptimizedCover";
import { ShowFavoriteHeart } from "@/components/ShowFavoriteHeart";
import { ShowCard } from "@/components/ShowCard";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
};

/** RSS fetched on demand per show (not at build time). Longer window = fewer ISR revalidations at scale. */
export const revalidate = 21_600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const show = getShow(slug);
  if (!show) return {};
  const rawMetaDesc = (show.data.description ?? "").trim();
  const description = shouldShowShowDescription(rawMetaDesc, show.data.title)
    ? rawMetaDesc
    : `Listen to ${show.data.title} in the Podcast library.`;
  const images = show.data.cover_image
    ? [{ url: show.data.cover_image, width: 640, height: 640, alt: show.data.title }]
    : undefined;
  return {
    title: show.data.title,
    description,
    alternates: { canonical: `/shows/${slug}` },
    openGraph: {
      title: show.data.title,
      description,
      type: "website",
      url: `/shows/${slug}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: show.data.title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}

export default async function ShowPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sortParam = sp.sort;

  const show = getShow(slug);
  if (!show) notFound();

  const rawDesc = (show.data.description ?? "").trim();
  const showDesc = shouldShowShowDescription(rawDesc, show.data.title) ? rawDesc : "";

  let episodes: Awaited<ReturnType<typeof fetchRssEpisodes>> = [];
  let rssError: string | null = null;
  if (show.data.rss_url) {
    try {
      episodes = await fetchRssEpisodes(show.data.rss_url);
    } catch (e) {
      rssError = e instanceof Error ? e.message : "Could not load RSS feed.";
    }
  }

  const numberedDetected = detectNumberedEpisodes(episodes);
  const episodeSort = resolveEpisodeSort(sortParam, episodes);
  const sortQuery =
    sortParam === "newest" || sortParam === "oldest" || sortParam === "episode" ? sortParam : undefined;

  const cover = show.data.cover_image;

  const listEntries = getShowListEntriesCached();
  const recommended = recommendedShowEntries(show.slug, listEntries, 6);

  return (
    <div>
      <p className="back">
        <Link href="/shows">← All shows</Link>
      </p>

      <header className="show-hero">
        <div className="show-hero__media">
          <ShowFavoriteHeart slug={show.slug} showTitle={show.data.title} />
          {cover ? (
            <div className="show-hero__cover">
              <OptimizedCover
                src={cover}
                alt={show.data.title}
                width={640}
                height={640}
                sizes="(max-width: 720px) 100vw, 320px"
                responsive
                priority
                quality={78}
              />
            </div>
          ) : (
            <div className="show-hero__cover show-hero__cover--empty" aria-hidden>
              <span className="show-hero__cover-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </span>
            </div>
          )}
        </div>
        <div>
          <h1 className="show-hero__title">{show.data.title}</h1>
          {showDesc ? <p className="show-hero__desc">{showDesc}</p> : null}
          {show.body ? (
            <div className="hero__lede" style={{ marginTop: "1rem" }}>
              <Markdown source={show.body} />
            </div>
          ) : null}
          {(show.data.apple_podcasts_url || show.data.spotify_url) && (
            <div className="listen-row">
              {show.data.apple_podcasts_url ? (
                <a href={show.data.apple_podcasts_url} target="_blank" rel="noreferrer">
                  Apple Podcasts
                </a>
              ) : null}
              {show.data.spotify_url ? (
                <a href={show.data.spotify_url} target="_blank" rel="noreferrer">
                  Spotify
                </a>
              ) : null}
            </div>
          )}
        </div>
      </header>

      <h2 className="section-title">Episodes</h2>

      {rssError ? <p className="section-sub">Could not load feed: {rssError}</p> : null}
      {!show.data.rss_url ? (
        <p className="section-sub">No RSS URL configured for this show.</p>
      ) : rssError ? null : episodes.length === 0 ? (
        <p className="section-sub">No episodes found in the feed.</p>
      ) : (
        <EpisodeList
          showSlug={show.slug}
          showTitle={show.data.title}
          coverFallback={show.data.cover_image}
          episodes={episodes}
          sort={episodeSort}
          sortQuery={sortQuery}
          numberedDetected={numberedDetected}
          page={page}
        />
      )}

      {recommended.length > 0 ? (
        <section className="show-recommended" aria-labelledby="show-recommended-heading">
          <h2 id="show-recommended-heading" className="section-title">
            You might also like
          </h2>
          <p className="section-sub">
            Picks from the same categories when we have them; others fill in from the catalog. Refreshes daily.
          </p>
          <div className="card-grid">
            {recommended.map((s) => (
              <ShowCard key={s.slug} show={s} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
