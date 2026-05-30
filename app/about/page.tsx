import type { Metadata } from "next";
import Link from "next/link";
import { SITE_SEO_DESCRIPTION } from "@/lib/site-seo";

const ABOUT_DESC =
  "What Podcast library is: a free web directory and in-browser player for public podcast RSS feeds. How listening and progress work on your device.";

export const metadata: Metadata = {
  title: "About",
  description: ABOUT_DESC,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | Podcast library",
    description: ABOUT_DESC,
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="recent-page">
      <h1 className="hero__title">About Podcast library</h1>
      <p className="hero__lede">{SITE_SEO_DESCRIPTION}</p>

      <div className="hero__lede hero__lede--md" style={{ marginTop: "1.5rem" }}>
        <p>
          <strong>What this site is.</strong> Podcast library is a curated directory of shows with episode lists
          loaded from each publisher&apos;s public RSS feed. You can browse by category, search titles, and play audio
          in your browser using the persistent player at the bottom of the screen.
        </p>
        <p>
          <strong>Listening progress.</strong> Recently played episodes, playback position, and favorites are stored
          in <em>this browser only</em> (local storage). They do not sync across devices unless you use the same
          browser profile everywhere.
        </p>
        <p>
          <strong>Content and rights.</strong> Audio is streamed from the URLs provided in each show&apos;s RSS feed.
          Show descriptions and artwork typically come from those feeds. If you are a rights holder and need a feed or
          listing updated or removed, use the contact path your host provides for the domain.
        </p>
        <p>
          <strong>Editorial guides.</strong> The{" "}
          <Link href="/blog">blog</Link> publishes short, human-written guides on what the site is, how to listen in
          your browser, and which collections to explore—useful for discoverability in search and AI tools that cite
          clear, stable pages.
        </p>
        <p className="section-sub" style={{ marginTop: "1.5rem" }}>
          <Link href="/shows">Browse all shows</Link>
          {" · "}
          <Link href="/category/daily">Daily collection</Link>
          {" · "}
          <Link href="/">Home</Link>
        </p>
      </div>
    </div>
  );
}
