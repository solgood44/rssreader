"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sortEntries, type ShowListEntry, type SortMode } from "@/lib/show-search";
import { ShowCard } from "./ShowCard";

function parseRequestedSort(sort: string | null): SortMode | undefined {
  if (sort === "az" || sort === "za" || sort === "random") return sort;
  return undefined;
}

export function SortableShowGrid({
  entries,
  defaultSort,
}: {
  entries: ShowListEntry[];
  defaultSort?: SortMode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedSort = parseRequestedSort(searchParams.get("sort"));
  const activeSort = requestedSort ?? defaultSort;
  const seedStr = searchParams.get("seed");
  const randomSeed =
    seedStr != null && seedStr !== "" ? parseInt(seedStr, 10) || 1337 : 1337;

  const shows = useMemo(
    () => (requestedSort ? sortEntries(entries, requestedSort, randomSeed) : entries),
    [entries, randomSeed, requestedSort],
  );

  const pushParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      mutate(p);
      const qs = p.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const setSort = (mode: SortMode) => {
    pushParams((p) => {
      if (defaultSort === mode) {
        p.delete("sort");
        p.delete("seed");
      } else {
        p.set("sort", mode);
        if (mode === "random") p.set("seed", String(Date.now() & 0x7fffffff));
        else p.delete("seed");
      }
      p.delete("page");
    });
  };

  return (
    <>
      <div className="shows-toolbar">
        <div className="shows-toolbar__sort" role="group" aria-label="Sort shows">
          <span className="shows-toolbar__label">Sort</span>
          <button
            type="button"
            className={`shows-sort-btn${activeSort === "az" ? " is-active" : ""}`}
            onClick={() => setSort("az")}
          >
            A-Z
          </button>
          <button
            type="button"
            className={`shows-sort-btn${activeSort === "za" ? " is-active" : ""}`}
            onClick={() => setSort("za")}
          >
            Z-A
          </button>
          <button
            type="button"
            className={`shows-sort-btn${activeSort === "random" ? " is-active" : ""}`}
            onClick={() => setSort("random")}
          >
            Random
          </button>
        </div>
      </div>

      <div className="card-grid">
        {shows.map((s) => (
          <ShowCard key={s.slug} show={s} />
        ))}
      </div>
    </>
  );
}
