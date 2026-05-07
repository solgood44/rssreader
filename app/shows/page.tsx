import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllShows } from "@/lib/content";
import { showsToListEntries } from "@/lib/show-search";
import { ShowsDirectoryClient } from "@/components/ShowsDirectoryClient";

export const metadata: Metadata = {
  title: "All shows",
  description: "Search and browse the full podcast directory — stories, sleep audio, learning, and more.",
  alternates: { canonical: "/shows" },
};

function ShowsFallback() {
  return (
    <div>
      <h1 className="hero__title">All shows</h1>
      <p className="hero__lede">Loading directory…</p>
    </div>
  );
}

export default function ShowsDirectoryPage() {
  const entries = showsToListEntries(getAllShows());

  return (
    <>
      <section className="hero">
        <h1 className="hero__title">All shows</h1>
        <p className="hero__lede">
          Search by title in the header, or browse categories to find something that fits your mood.
        </p>
      </section>

      <Suspense fallback={<ShowsFallback />}>
        <ShowsDirectoryClient entries={entries} />
      </Suspense>
    </>
  );
}
