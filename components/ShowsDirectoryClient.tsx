"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import type { DirectoryPageResult } from "@/lib/show-directory";
import type { SortMode } from "@/lib/show-search";
import { ShowCard } from "./ShowCard";

function parseSort(s: string | null): SortMode {
  if (s === "za" || s === "random") return s;
  return "az";
}

export function ShowsDirectoryClient({ directory }: { directory: DirectoryPageResult }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = parseSort(searchParams.get("sort"));
  const q = (searchParams.get("q") ?? "").trim();
  const urlPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  /** Server clamps page when filters shrink; align URL so pager and bookmarks stay consistent. */
  useEffect(() => {
    if (urlPage === directory.page) return;
    const p = new URLSearchParams(searchParams.toString());
    if (directory.page <= 1) p.delete("page");
    else p.set("page", String(directory.page));
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [directory.page, pathname, router, searchParams, urlPage]);

  const clearSearchHref = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("q");
    p.delete("page");
    const s = p.toString();
    return s ? `${pathname}?${s}` : pathname;
  }, [pathname, searchParams]);

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

  const { shows, total, totalCatalog, page: safePage, pages: totalPages } = directory;

  return (
    <div>
      <p className="hero__lede">
        {total === totalCatalog ? `${totalCatalog} shows` : `${total} matching · ${totalCatalog} total`}
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

      {shows.length === 0 ? (
        <div>
          <p className="section-sub">No shows match “{q}”. Try another search in the header or clear the filter.</p>
          <p className="section-sub">
            <Link href={clearSearchHref}>Clear search</Link> or <Link href="/category">browse categories</Link>.
          </p>
        </div>
      ) : (
        <div className="card-grid">
          {shows.map((s) => (
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
