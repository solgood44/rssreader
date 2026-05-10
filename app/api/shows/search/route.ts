import { NextResponse } from "next/server";
import { getShowListEntriesCached } from "@/lib/show-list-cache";
import { suggestionShows } from "@/lib/show-search";

const MAX_Q = 120;
const DEFAULT_LIMIT = 12;

/**
 * Server-side show autocomplete. Cached catalog in memory per warm function;
 * response is CDN-cacheable briefly to cut repeat invocations for popular queries.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

  if (!q || q.length > MAX_Q) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  const entries = getShowListEntriesCached();
  const results = suggestionShows(entries, q, limit);

  return NextResponse.json(
    { results },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=86400",
      },
    },
  );
}
