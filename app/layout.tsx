import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { AudioDock } from "@/components/audio/AudioDock";
import { AudioPlayerProvider } from "@/components/audio/AudioPlayerContext";
import { AppChrome } from "@/components/AppChrome";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { PageView } from "@/components/analytics/PageView";
import { WebsiteJsonLd } from "@/components/WebsiteJsonLd";
import { getAllCategories } from "@/lib/content";
import { SITE_SEO_DESCRIPTION, SITE_SEO_KEYWORDS } from "@/lib/site-seo";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Podcast library — free online shows & stories",
    template: "%s | Podcast library",
  },
  description: SITE_SEO_DESCRIPTION,
  applicationName: "Podcast library",
  keywords: [...SITE_SEO_KEYWORDS],
  authors: [{ name: "Podcast library" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Podcast library",
    title: "Podcast library — free online shows & stories",
    description: SITE_SEO_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Podcast library — free online shows & stories",
    description: SITE_SEO_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
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

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('sgm-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body>
        <WebsiteJsonLd />
        <AudioPlayerProvider>
          <AppChrome categories={categories}>
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
