"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { sortEntries, type ShowListEntry, type SortMode } from "@/lib/show-search";
import { ShowCard } from "./ShowCard";

function parseSort(value: string | null, defaultSort: SortMode | null): SortMode | null {
  if (value === "az" || value === "za" || value === "random") return value;
  return defaultSort;
}

export function CategoryShowsClient({
  entries,
  defaultSort = "az",
}: {
  entries: ShowListEntry[];
  defaultSort?: SortMode | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = parseSort(searchParams.get("sort"), defaultSort);
  const seedStr = searchParams.get("seed");
  const randomSeed =
    seedStr != null && seedStr !== "" ? parseInt(seedStr, 10) || 1337 : 1337;

  const sorted = useMemo(
    () => (sort ? sortEntries(entries, sort, randomSeed) : entries),
    [entries, sort, randomSeed],
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
      if (mode === defaultSort) {
        p.delete("sort");
        p.delete("seed");
      } else {
        p.set("sort", mode);
        if (mode === "random") p.set("seed", String(Date.now() & 0x7fffffff));
        else p.delete("seed");
      }
    });
  };

  return (
    <>
      <div className="shows-toolbar">
        <div className="shows-toolbar__sort" role="group" aria-label="Sort category shows">
          <span className="shows-toolbar__label">Sort</span>
          <button
            type="button"
            className={`shows-sort-btn${sort === "az" ? " is-active" : ""}`}
            onClick={() => setSort("az")}
          >
            A-Z
          </button>
          <button
            type="button"
            className={`shows-sort-btn${sort === "za" ? " is-active" : ""}`}
            onClick={() => setSort("za")}
          >
            Z-A
          </button>
          <button
            type="button"
            className={`shows-sort-btn${sort === "random" ? " is-active" : ""}`}
            onClick={() => setSort("random")}
          >
            Random
          </button>
        </div>
      </div>

      <div className="card-grid">
        {sorted.map((show) => (
          <ShowCard key={show.slug} show={show} />
        ))}
      </div>
    </>
  );
}
