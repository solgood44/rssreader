import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getDirectoryPage,
  parseDirectoryPageNumber,
  parseDirectoryQuery,
  parseDirectorySeed,
  parseDirectorySort,
} from "@/lib/show-directory";
import { ShowsDirectoryClient } from "@/components/ShowsDirectoryClient";

export const metadata: Metadata = {
  title: "All shows",
  description:
    "Browse the full podcast library A–Z, filter by title, and open any show to stream episodes in your browser.",
  alternates: { canonical: "/shows" },
  openGraph: {
    title: "All shows | Podcast library",
    description:
      "Browse the full podcast library A–Z, filter by title, and open any show to stream episodes in your browser.",
    url: "/shows",
  },
};

function ShowsFallback() {
  return <p className="hero__lede">Loading directory…</p>;
}

function spFirst(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

async function ShowsDirectoryResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = parseDirectoryQuery(spFirst(sp.q));
  const sort = parseDirectorySort(spFirst(sp.sort));
  const randomSeed = parseDirectorySeed(spFirst(sp.seed));
  const page = parseDirectoryPageNumber(spFirst(sp.page));
  const directory = getDirectoryPage({ q, sort, randomSeed, page });
  return <ShowsDirectoryClient directory={directory} />;
}

export default function ShowsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<ShowsFallback />}>
      <ShowsDirectoryResults searchParams={searchParams} />
    </Suspense>
  );
}
