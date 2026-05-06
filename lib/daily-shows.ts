import {
  getCategory,
  orderShowsByRssAllowlist,
  showsForCategoryConfig,
  type ShowRecord,
} from "@/lib/content";

/** Homepage “daily” row — order and membership come from `content/categories/daily.md` (`category_rss_allowlist`). */
export function getDailyFeaturedShows(): ShowRecord[] {
  const cat = getCategory("daily");
  if (!cat) return [];
  const allow = cat.data.category_rss_allowlist;
  if (!allow?.length) return [];
  const records = showsForCategoryConfig(cat.data);
  return orderShowsByRssAllowlist(records, allow);
}
