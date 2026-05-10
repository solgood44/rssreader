import { getShowListEntriesCached } from "./show-list-cache";
import {
  filterShows,
  sortEntries,
  shouldShowShowDescription,
  type ShowListEntry,
  type SortMode,
} from "./show-search";

export const SHOWS_DIRECTORY_PAGE_SIZE = 48;

export type DirectoryPageResult = {
  shows: ShowListEntry[];
  /** Count after filter + sort (matches length of full sorted list). */
  total: number;
  /** Full catalog size before filter. */
  totalCatalog: number;
  page: number;
  pageSize: number;
  pages: number;
};

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

export function parseDirectorySort(param: string | undefined): SortMode {
  if (param === "za" || param === "random") return param;
  return "az";
}

export function parseDirectorySeed(param: string | undefined): number {
  if (param == null || param === "") return 1337;
  const n = parseInt(param, 10);
  return Number.isFinite(n) ? n : 1337;
}

export function parseDirectoryQuery(param: string | undefined): string {
  if (!param || typeof param !== "string") return "";
  return param.trim().slice(0, 160);
}

export function parseDirectoryPageNumber(param: string | undefined): number {
  const n = parseInt(param ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function getDirectoryPage(input: {
  q: string;
  sort: SortMode;
  randomSeed: number;
  page: number;
  pageSize?: number;
}): DirectoryPageResult {
  const pageSize = input.pageSize ?? SHOWS_DIRECTORY_PAGE_SIZE;
  const all = getShowListEntriesCached();
  const totalCatalog = all.length;
  const filtered = filterShows(all, input.q);
  const sorted = sortEntries(filtered, input.sort, input.randomSeed);
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
