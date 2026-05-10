import type { MetadataRoute } from "next";
import { SITE_SEO_DESCRIPTION } from "@/lib/site-seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Podcast library",
    short_name: "Podcasts",
    description: SITE_SEO_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0c0f14",
    theme_color: "#4ade80",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
    ],
  };
}
