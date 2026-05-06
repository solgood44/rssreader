import { FavoritesPageClient } from "@/components/FavoritesPageClient";
import { getAllShows } from "@/lib/content";
import { showsToListEntries } from "@/lib/show-search";

export const metadata = { title: "Favorites" };

export default function FavoritesPage() {
  const allEntries = showsToListEntries(getAllShows());
  return <FavoritesPageClient allEntries={allEntries} />;
}
