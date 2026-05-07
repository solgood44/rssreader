import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllShows } from "@/lib/content";
import { showsToListEntries } from "@/lib/show-search";
import { ShowsDirectoryClient } from "@/components/ShowsDirectoryClient";

export const metadata: Metadata = {
  title: "All shows",
  description: "Search and browse the full Sol Good Media podcast directory — stories, sleep audio, learning, and more.",
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
    <Suspense fallback={<ShowsFallback />}>
      <ShowsDirectoryClient entries={entries} />
    </Suspense>
  );
}
