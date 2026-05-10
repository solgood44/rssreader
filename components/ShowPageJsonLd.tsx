import { getShowStructuredDataPlainDescription } from "@/lib/show-search";
import type { ShowRecord } from "@/lib/content";

function absoluteAssetUrl(siteBaseNoSlash: string, src: string | undefined): string | undefined {
  if (!src?.trim()) return undefined;
  const u = src.trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  const path = u.startsWith("/") ? u : `/${u}`;
  return `${siteBaseNoSlash}${path}`;
}

/**
 * BreadcrumbList + PodcastSeries for show URLs (matches on-page content; RSS linked when present).
 */
export function ShowPageJsonLd({ siteBaseNoSlash, show }: { siteBaseNoSlash: string; show: ShowRecord }) {
  const showUrl = `${siteBaseNoSlash}/shows/${show.slug}`;
  const description = getShowStructuredDataPlainDescription(show);
  const imageUrl = absoluteAssetUrl(siteBaseNoSlash, show.data.cover_image);
  const rssUrl = show.data.rss_url?.trim();

  const podcastSeries: Record<string, unknown> = {
    "@type": "PodcastSeries",
    "@id": `${showUrl}#podcastseries`,
    url: showUrl,
    name: show.data.title,
    description,
    inLanguage: "en-US",
  };
  if (imageUrl) {
    podcastSeries.image = imageUrl;
  }
  if (rssUrl) {
    podcastSeries.associatedMedia = {
      "@type": "MediaObject",
      encodingFormat: "application/rss+xml",
      contentUrl: rssUrl,
    };
  }

  const graph = [
    {
      "@type": "BreadcrumbList",
      "@id": `${showUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteBaseNoSlash,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "All shows",
          item: `${siteBaseNoSlash}/shows`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: show.data.title,
          item: showUrl,
        },
      ],
    },
    podcastSeries,
  ];

  const payload = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
