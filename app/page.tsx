import type { Metadata } from "next";
import Link from "next/link";
import { getDailyShowsByLatestActivity } from "@/lib/daily-recent-activity";
import { getDailyFeaturedShows } from "@/lib/daily-shows";
import { getShowListEntriesCached } from "@/lib/show-list-cache";
import { SITE_SEO_DESCRIPTION } from "@/lib/site-seo";
import { showsToListEntries } from "@/lib/show-search";
import { ShowCard } from "@/components/ShowCard";

/** Homepage: daily row + sample grid (capped for weight). */
const HOME_SHOW_LIMIT = 18;

export const metadata: Metadata = {
  title: {
    absolute: "Podcast library — free online shows & stories",
  },
  description: SITE_SEO_DESCRIPTION,
  openGraph: {
    title: "Podcast library — free online shows & stories",
    description: SITE_SEO_DESCRIPTION,
    url: "/",
  },
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const dailyFeatured = showsToListEntries(getDailyFeaturedShows());
  const featuredSlugs = new Set(dailyFeatured.map((s) => s.slug));

  const dailyFresh =
    dailyFeatured.length > 0
      ? showsToListEntries(await getDailyShowsByLatestActivity()).slice(0, 6)
      : [];

  const catalog = getShowListEntriesCached();
  const shows = catalog
    .filter((s) => !featuredSlugs.has(s.slug))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))
    .slice(0, HOME_SHOW_LIMIT);

  return (
    <div>
      <section className="hero">
        <h1 className="hero__title">Your podcast library for calm shows and stories</h1>
        <p className="hero__lede">{SITE_SEO_DESCRIPTION}</p>
        <div className="hero__cta hero-actions">
          <Link href="/shows" className="hero-actions__primary">
            Browse all shows
          </Link>
          <Link href="/category" className="hero-actions__secondary">
            Explore categories
          </Link>
          <Link href="/recent" className="hero-actions__tertiary">
            Continue listening
          </Link>
        </div>
      </section>

      {dailyFeatured.length > 0 ? (
        <section className="home-daily" aria-labelledby="home-daily-heading">
          <h2 id="home-daily-heading" className="section-title">
            Daily shows
          </h2>
          <p className="section-sub">
            New episodes every day — relax, learn, or unwind.{" "}
            <Link href="/category/daily">View the Daily category →</Link>
          </p>
          <div className="card-grid">
            {dailyFeatured.map((s) => (
              <ShowCard key={s.slug} show={s} />
            ))}
          </div>
        </section>
      ) : null}

      {dailyFresh.length > 0 ? (
        <section className="home-daily-fresh" aria-labelledby="home-daily-fresh-heading">
          <h2 id="home-daily-fresh-heading" className="section-title">
            Recently updated (Daily)
          </h2>
          <p className="section-sub">
            Same Daily collection as above, ordered by the newest episode activity in each feed—handy when you check
            back often. Refreshes about every hour.{" "}
            <Link href="/blog/how-to-listen-to-podcasts-in-your-browser">Listening guide →</Link>
          </p>
          <div className="card-grid">
            {dailyFresh.map((s) => (
              <ShowCard key={`fresh-${s.slug}`} show={s} />
            ))}
          </div>
        </section>
      ) : null}

      <h2 className="section-title">More shows</h2>
      <p className="section-sub">
        A sample of the catalog ({shows.length} of {Math.max(0, catalog.length - featuredSlugs.size)} outside the
        daily row). Open the directory for the full list.
      </p>

      <div className="card-grid">
        {shows.map((s) => (
          <ShowCard key={s.slug} show={s} />
        ))}
      </div>
    </div>
  );
}
