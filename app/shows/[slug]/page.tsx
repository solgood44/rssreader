import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllShows, getShow } from "@/lib/content";
import { fetchRssEpisodes } from "@/lib/rss";
import { EpisodeList } from "@/components/EpisodeList";
import { Markdown } from "@/components/Markdown";
import { OptimizedCover } from "@/components/OptimizedCover";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

/** RSS is fetched on demand (cached via fetch revalidate) — avoid build-time fan-out to every feed. */
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const show = getShow(slug);
  if (!show) return {};
  return { title: show.data.title, description: show.data.description };
}

export default async function ShowPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const show = getShow(slug);
  if (!show) notFound();

  let episodes: Awaited<ReturnType<typeof fetchRssEpisodes>> = [];
  let rssError: string | null = null;
  if (show.data.rss_url) {
    try {
      episodes = await fetchRssEpisodes(show.data.rss_url);
    } catch (e) {
      rssError = e instanceof Error ? e.message : "Could not load RSS feed.";
    }
  }

  const cover = show.data.cover_image;

  return (
    <div>
      <p className="back">
        <Link href="/shows">← All shows</Link>
      </p>

      <header className="show-hero">
        {cover ? (
          <div className="show-hero__cover">
            <OptimizedCover src={cover} alt={show.data.title} size={320} priority />
          </div>
        ) : null}
        <div>
          <h1 className="show-hero__title">{show.data.title}</h1>
          {show.data.description ? <p className="show-hero__desc">{show.data.description}</p> : null}
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
      <p className="section-sub">Loaded from the public RSS feed (cached on the server).</p>

      {rssError ? <p className="section-sub">RSS: {rssError}</p> : null}
      {!show.data.rss_url ? (
        <p className="section-sub">No RSS URL configured for this show.</p>
      ) : rssError ? null : episodes.length === 0 ? (
        <p className="section-sub">No episodes found in the feed.</p>
      ) : (
        <EpisodeList
          showSlug={show.slug}
          coverFallback={show.data.cover_image}
          episodes={episodes}
          page={page}
        />
      )}
    </div>
  );
}
