import { getAllShows } from "./content";
import { showsToListEntries, type ShowListEntry } from "./show-search";

export type RadioShowsGroup = {
  title: string;
  shows: ShowListEntry[];
};

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function isRadioShow(entry: ShowListEntry): boolean {
  const title = norm(entry.title);
  const desc = norm(entry.description ?? "");
  return title.includes("radio") || desc.includes("radio");
}

function alphaGroupKey(title: string): string {
  const t = title.trim();
  const ch = t[0]?.toUpperCase() ?? "#";
  return /[A-Z]/.test(ch) ? ch : "#";
}

export function getRadioShows(): { total: number; groups: RadioShowsGroup[]; shows: ShowListEntry[] } {
  const entries = showsToListEntries(getAllShows());
  const radio = entries.filter(isRadioShow);
  radio.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));

  const map = new Map<string, ShowListEntry[]>();
  for (const s of radio) {
    const k = alphaGroupKey(s.title);
    const arr = map.get(k);
    if (arr) arr.push(s);
    else map.set(k, [s]);
  }

  const keys = Array.from(map.keys()).sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });

  const groups: RadioShowsGroup[] = keys.map((k) => ({ title: k, shows: map.get(k) ?? [] }));
  return { total: radio.length, groups, shows: radio };
}

