import {
  parseDirectoryPageNumber,
  parseDirectorySeed,
  parseDirectorySort,
  SHOWS_DIRECTORY_PAGE_SIZE,
  type DirectoryPageResult,
} from "@/lib/show-directory";
import { sortEntries, shouldShowShowDescription, type ShowListEntry, type SortMode } from "@/lib/show-search";

function slimEntryForDirectoryCard(entry: ShowListEntry): ShowListEntry {
  const d = entry.description.trim();
  if (!d) return { ...entry, description: "" };
  if (!shouldShowShowDescription(d, entry.title)) {
    return { ...entry, description: "" };
  }
  const max = 280;
  if (d.length <= max) return { ...entry, description: d };
  return { ...entry, description: `${d.slice(0, max).trimEnd()}…` };
}

function spFirst(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function parseCategorySearchParams(sp: Record<string, string | string[] | undefined>): {
  sort: SortMode;
  randomSeed: number;
  page: number;
} {
  return {
    sort: parseDirectorySort(spFirst(sp.sort)),
    randomSeed: parseDirectorySeed(spFirst(sp.seed)),
    page: parseDirectoryPageNumber(spFirst(sp.page)),
  };
}

export function getCategoryDirectoryPage(
  entries: ShowListEntry[],
  input: { sort: SortMode; randomSeed: number; page: number; pageSize?: number },
): DirectoryPageResult {
  const pageSize = input.pageSize ?? SHOWS_DIRECTORY_PAGE_SIZE;
  const totalCatalog = entries.length;
  const sorted = sortEntries(entries, input.sort, input.randomSeed);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(1, input.page), pages);
  const start = (page - 1) * pageSize;
  const slice = sorted.slice(start, start + pageSize);
  const shows = slice.map(slimEntryForDirectoryCard);
  return {
    shows,
    total: sorted.length,
    totalCatalog,
    page,
    pageSize,
    pages,
  };
}
