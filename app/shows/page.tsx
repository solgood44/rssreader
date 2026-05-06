import { Suspense } from "react";
import { getAllShows } from "@/lib/content";
import { showsToListEntries } from "@/lib/show-search";
import { ShowsDirectoryClient } from "@/components/ShowsDirectoryClient";

export const metadata = { title: "Shows" };

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
