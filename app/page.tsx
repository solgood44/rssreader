import Link from "next/link";
import { getAllShows, getHomepageMarkdown } from "@/lib/content";
import { Markdown } from "@/components/Markdown";
import { ShowCard } from "@/components/ShowCard";

/** Homepage mirrors Grav `01.home`: intro copy + grid of shows (capped for weight). */
const HOME_SHOW_LIMIT = 18;

export default function HomePage() {
  const home = getHomepageMarkdown();
  const allShows = getAllShows();
  const shows = allShows
    .sort((a, b) => a.data.title.localeCompare(b.data.title, undefined, { sensitivity: "base" }))
    .slice(0, HOME_SHOW_LIMIT);

  return (
    <div>
      <header className="hero">
        <h1 className="hero__title">Home</h1>
        {home ? (
          <div className="hero__lede">
            <Markdown source={home.body} />
          </div>
        ) : (
          <p className="hero__lede">Welcome to Sol Good Media.</p>
        )}
        <p className="hero__cta">
          <Link href="/shows">Browse full directory →</Link>
        </p>
      </header>

      <h2 className="section-title">Shows</h2>
      <p className="section-sub">
        A sample of the catalog ({HOME_SHOW_LIMIT} of {allShows.length}). Open the directory for the full list.
      </p>

      <div className="card-grid">
        {shows.map((s) => (
          <ShowCard key={s.slug} show={s} />
        ))}
      </div>
    </div>
  );
}
