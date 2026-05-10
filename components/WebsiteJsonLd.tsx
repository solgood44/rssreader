import { SITE_SEO_DESCRIPTION } from "@/lib/site-seo";
import { getSiteUrl } from "@/lib/site";

/**
 * WebSite + Organization + SearchAction for Google rich results / sitelinks search box eligibility.
 */
export function WebsiteJsonLd() {
  const { origin } = getSiteUrl();
  const base = origin.replace(/\/$/, "");

  const graph = [
    {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      url: base,
      name: "Podcast library",
      description: SITE_SEO_DESCRIPTION,
      inLanguage: "en-US",
      publisher: { "@id": `${base}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${base}/shows?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: "Podcast library",
      url: base,
      description: SITE_SEO_DESCRIPTION,
    },
  ];

  const payload = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify prevents injection from controlled object graph only.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
