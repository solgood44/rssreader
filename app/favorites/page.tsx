import type { Metadata } from "next";
import { FavoritesPageClient } from "@/components/FavoritesPageClient";
import { getAllShows } from "@/lib/content";
import { showsToListEntries } from "@/lib/show-search";

export const metadata: Metadata = {
  title: "Favorites",
  description: "Podcasts you’ve saved in this browser — quick access to your favorites.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/favorites" },
};

export default function FavoritesPage() {
  const allEntries = showsToListEntries(getAllShows());
  return <FavoritesPageClient allEntries={allEntries} />;
}
