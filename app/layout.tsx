import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { AudioDock } from "@/components/audio/AudioDock";
import { AudioPlayerProvider } from "@/components/audio/AudioPlayerContext";
import { AppChrome } from "@/components/AppChrome";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { PageView } from "@/components/analytics/PageView";
import { getAllCategories, getAllShows } from "@/lib/content";
import { getSiteUrl } from "@/lib/site";
import { showsToListEntries } from "@/lib/show-search";
import "./globals.css";

const siteUrl = getSiteUrl();
const defaultDescription =
  "Calm shows, stories, and sleep-friendly listening. Browse podcasts by category, save favorites, and listen in your browser.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Podcast library",
    template: "%s | Podcast library",
  },
  description: defaultDescription,
  applicationName: "Podcast library",
  keywords: [
    "podcast",
    "podcasts",
    "audiobooks",
    "audio stories",
    "sleep sounds",
    "relaxation",
    "free podcasts",
  ],
  authors: [{ name: "Podcast library" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Podcast library",
    title: "Podcast library",
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "Podcast library",
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

function navCategories() {
  const rows = getAllCategories().map((c) => ({
    slug: c.slug,
    title: c.data.title || c.slug,
  }));
  rows.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  const dailyIdx = rows.findIndex((c) => c.slug === "daily");
  if (dailyIdx > 0) {
    const [daily] = rows.splice(dailyIdx, 1);
    rows.unshift(daily);
  }
  return rows;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = navCategories();
  const showEntries = showsToListEntries(getAllShows());

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('sgm-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AudioPlayerProvider>
          <AppChrome categories={categories} showEntries={showEntries}>
            {children}
          </AppChrome>
          <AudioDock />
        </AudioPlayerProvider>
        <SpeedInsights />
        <Analytics />
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <PageView />
        </Suspense>
      </body>
    </html>
  );
}
