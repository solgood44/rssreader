"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { sortEntries, type ShowListEntry, type SortMode } from "@/lib/show-search";
import { ShowCard } from "./ShowCard";

function parseSort(s: string | null): SortMode {
  if (s === "za" || s === "random") return s;
  return "az";
}

export function CategoryShowsClient({ entries }: { entries: ShowListEntry[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = parseSort(searchParams.get("sort"));
  const seedStr = searchParams.get("seed");
  const randomSeed =
    seedStr != null && seedStr !== "" ? parseInt(seedStr, 10) || 1337 : 1337;

  const sorted = useMemo(() => sortEntries(entries, sort, randomSeed), [entries, sort, randomSeed]);

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
      if (mode === "az") {
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
        <div className="shows-toolbar__sort" role="group" aria-label="Sort shows in this category">
          <span className="shows-toolbar__label">Sort</span>
          <button
            type="button"
            className={`shows-sort-btn${sort === "az" ? " is-active" : ""}`}
            onClick={() => setSort("az")}
          >
            A–Z
          </button>
          <button
            type="button"
            className={`shows-sort-btn${sort === "za" ? " is-active" : ""}`}
            onClick={() => setSort("za")}
          >
            Z–A
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
        {sorted.map((s) => (
          <ShowCard key={s.slug} show={s} />
        ))}
      </div>
    </>
  );
}
