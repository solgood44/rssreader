import Link from "next/link";
import { notFound } from "next/navigation";
import { getShow } from "@/lib/content";
import { fetchRssEpisodes } from "@/lib/rss";
import { findEpisode, parseCompositeEpisodeSlug } from "@/lib/episodes";
import { ExternalAudio } from "@/components/ExternalAudio";
import { OptimizedCover } from "@/components/OptimizedCover";
import ReactMarkdown from "react-markdown";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { slug: full } = await params;
  const parts = parseCompositeEpisodeSlug(full);
  if (!parts) return {};
  const show = getShow(parts.showSlug);
  if (!show?.data.rss_url) return { title: "Episode" };
  try {
    const eps = await fetchRssEpisodes(show.data.rss_url);
    const ep = findEpisode(eps, parts.episodeId);
    if (!ep) return { title: "Episode" };
    return { title: ep.title, description: ep.description.slice(0, 160) };
  } catch {
    return { title: "Episode" };
  }
}

export default async function EpisodePage({ params }: Props) {
  const { slug: full } = await params;
  const parts = parseCompositeEpisodeSlug(full);
  if (!parts) notFound();

  const show = getShow(parts.showSlug);
  if (!show?.data.rss_url) notFound();

  let episodes: Awaited<ReturnType<typeof fetchRssEpisodes>> = [];
  try {
    episodes = await fetchRssEpisodes(show.data.rss_url);
  } catch {
    notFound();
  }

  const ep = findEpisode(episodes, parts.episodeId);
  if (!ep) notFound();

  const art = ep.image || show.data.cover_image;

  return (
    <article>
      <p className="back">
        <Link href={`/shows/${show.slug}`}>← {show.data.title}</Link>
      </p>
      <h1 className="hero__title">{ep.title}</h1>
      {ep.pubDate ? (
        <p className="section-sub">
          <time dateTime={ep.pubDate}>{new Date(ep.pubDate).toLocaleString()}</time>
        </p>
      ) : null}

      {art ? (
        <div className="episode-page__cover">
          <OptimizedCover src={art} alt="" size={400} priority />
        </div>
      ) : null}

      {ep.audioUrl ? <ExternalAudio src={ep.audioUrl} title={ep.title} /> : <p className="section-sub">No audio enclosure in this feed item.</p>}

      {ep.description ? (
        <div className="md">
          <ReactMarkdown>{ep.description}</ReactMarkdown>
        </div>
      ) : null}

      {ep.link ? (
        <p className="section-sub">
          <a href={ep.link} target="_blank" rel="noreferrer">
            Open on Spreaker →
          </a>
        </p>
      ) : null}
    </article>
  );
}
