import { getAllShows } from "./content";
import { showsToListEntries, type ShowListEntry } from "./show-search";

/**
 * In-memory list of all shows for search (lightweight fields only).
 * Warmed once per Node process so repeated /api/shows/search calls do not
 * re-read thousands of markdown files on every keystroke.
 */
let cached: ShowListEntry[] | null = null;

export function getShowListEntriesCached(): ShowListEntry[] {
  if (!cached) cached = showsToListEntries(getAllShows());
  return cached;
}
