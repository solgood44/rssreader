"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import type { DirectoryPageResult } from "@/lib/show-directory";
import type { SortMode } from "@/lib/show-search";
import { ShowCard } from "./ShowCard";

function parseSort(s: string | null): SortMode {
  if (s === "za" || s === "random") return s;
  return "az";
}

export function CategoryShowsClient({ directory }: { directory: DirectoryPageResult }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = parseSort(searchParams.get("sort"));
  const urlPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  useEffect(() => {
    if (urlPage === directory.page) return;
    const p = new URLSearchParams(searchParams.toString());
    if (directory.page <= 1) p.delete("page");
    else p.set("page", String(directory.page));
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [directory.page, pathname, router, searchParams, urlPage]);

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
      <p className="hero__lede" style={{ marginTop: "0.5rem" }}>
        {total === totalCatalog ? `${totalCatalog} shows` : `${total} in this view`}
        {totalPages > 1 ? ` · page ${safePage} of ${totalPages}` : null}
      </p>

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

      {shows.length === 0 ? (
        <p className="section-sub">No shows in this category.</p>
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
