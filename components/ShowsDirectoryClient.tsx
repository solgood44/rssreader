"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { filterShows, sortEntries, type ShowListEntry, type SortMode } from "@/lib/show-search";
import { ShowCard } from "./ShowCard";

const PAGE_SIZE = 48;

function parseSort(s: string | null): SortMode {
  if (s === "za" || s === "random") return s;
  return "az";
}

export function ShowsDirectoryClient({ entries }: { entries: ShowListEntry[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = parseSort(searchParams.get("sort"));
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const seedStr = searchParams.get("seed");
  const randomSeed =
    seedStr != null && seedStr !== "" ? parseInt(seedStr, 10) || 1337 : 1337;

  const clearSearchHref = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("q");
    p.delete("page");
    const s = p.toString();
    return s ? `${pathname}?${s}` : pathname;
  }, [pathname, searchParams]);

  const filtered = useMemo(() => filterShows(entries, q), [entries, q]);
  const sorted = useMemo(
    () => sortEntries(filtered, sort, randomSeed),
    [filtered, sort, randomSeed],
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const slice = sorted.slice(start, start + PAGE_SIZE);

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
      p.delete("page");
    });
  };

  const setPage = (n: number) => {
    pushParams((p) => {
      if (n <= 1) p.delete("page");
      else p.set("page", String(n));
    });
  };

  return (
    <div>
      <h1 className="hero__title">All shows</h1>
      <p className="hero__lede">
        {sorted.length === entries.length
          ? `${entries.length} shows`
          : `${sorted.length} matching · ${entries.length} total`}
        {totalPages > 1 ? ` · page ${safePage} of ${totalPages}` : null}
      </p>

      {q ? (
        <p className="section-sub shows-filter-hint">
          Filtering by “{q}”.{" "}
          <Link href={clearSearchHref} className="shows-filter-hint__clear">
            Clear search
          </Link>
        </p>
      ) : null}

      <div className="shows-toolbar">
        <div className="shows-toolbar__sort" role="group" aria-label="Sort shows">
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

      {slice.length === 0 ? (
        <p className="section-sub">No shows match “{q}”. Try another search in the header or clear the filter.</p>
      ) : (
        <div className="card-grid">
          {slice.map((s) => (
            <ShowCard key={s.slug} show={s} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="pager-bar">
          {safePage > 1 ? (
            <button type="button" className="pager-link" onClick={() => setPage(safePage - 1)}>
              ← Previous
            </button>
          ) : (
            <span />
          )}
          {safePage < totalPages ? (
            <button type="button" className="pager-link" onClick={() => setPage(safePage + 1)}>
              Next →
            </button>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}
