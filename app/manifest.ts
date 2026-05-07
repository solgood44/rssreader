import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Podcast library — Sol Good Media",
    short_name: "Podcasts",
    description: "Calm shows, stories, and sleep-friendly listening from Sol Good Media.",
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
