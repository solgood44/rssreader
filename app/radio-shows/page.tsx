import type { Metadata } from "next";
import { getRadioShows } from "@/lib/radio-shows";
import { ShowCard } from "@/components/ShowCard";

export const metadata: Metadata = {
  title: "Radio shows",
  description: "Old-time radio and classic radio series in the Podcast library.",
  alternates: { canonical: "/radio-shows" },
};

export default function RadioShowsPage() {
  const { total, shows } = getRadioShows();

  return (
    <div>
      <section className="hero">
        <h1 className="hero__title">Radio shows</h1>
        <p className="hero__lede">
          Old-time radio favorites and classic series detected from show titles (for example: Gunsmoke, Dragnet, and
          Yours Truly, Johnny Dollar).
        </p>
        <p className="section-sub">{total} shows</p>
      </section>

      <div className="card-grid">
        {shows.map((s) => (
          <ShowCard key={s.slug} show={s} />
        ))}
      </div>
    </div>
  );
}

