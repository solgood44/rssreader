import { unstable_cache } from "next/cache";
import { getDailyFeaturedShows } from "@/lib/daily-shows";
import { fetchRssLatestTimestampMs } from "@/lib/rss";
import type { ShowRecord } from "@/lib/content";

const DAILY_FRESHNESS_REVALIDATE_SEC = 3600;

/**
 * Daily-category shows ordered by latest RSS activity (newest first).
 * Cached ~1h to avoid hammering feeds on every homepage load.
 */
export function getDailyShowsByLatestActivity(): Promise<ShowRecord[]> {
  return unstable_cache(
    async () => {
      const records = getDailyFeaturedShows();
      const scored = await Promise.all(
        records.map(async (r) => {
          const feed = r.data.rss_url?.trim();
          const ts = feed ? ((await fetchRssLatestTimestampMs(feed)) ?? 0) : 0;
          return { r, ts };
        }),
      );
      scored.sort((a, b) => b.ts - a.ts);
      return scored.map((x) => x.r);
    },
    ["daily-shows-by-rss-activity"],
    { revalidate: DAILY_FRESHNESS_REVALIDATE_SEC },
  )();
}
