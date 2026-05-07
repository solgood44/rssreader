import type { Metadata } from "next";
import Link from "next/link";
import { getAllShows } from "@/lib/content";
import { getDailyFeaturedShows } from "@/lib/daily-shows";
import { showsToListEntries } from "@/lib/show-search";
import { ShowCard } from "@/components/ShowCard";

/** Homepage: daily row + sample grid (capped for weight). */
const HOME_SHOW_LIMIT = 18;

const homeDescription =
  "Calm shows, stories, and sleep-friendly listening from Sol Good Media. Browse daily episodes, categories, and a full podcast directory.";

export const metadata: Metadata = {
  title: {
    absolute: "Podcast library",
  },
  description: homeDescription,
  openGraph: {
    title: "Podcast library — calm shows & stories",
    description: homeDescription,
    url: "/",
  },
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const allShows = getAllShows();
  const dailyFeatured = showsToListEntries(getDailyFeaturedShows());
  const featuredSlugs = new Set(dailyFeatured.map((s) => s.slug));

  const shows = showsToListEntries(allShows)
    .filter((s) => !featuredSlugs.has(s.slug))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))
    .slice(0, HOME_SHOW_LIMIT);

  return (
    <div>
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

      <h2 className="section-title">More shows</h2>
      <p className="section-sub">
        A sample of the catalog ({shows.length} of {Math.max(0, allShows.length - featuredSlugs.size)} outside the
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
