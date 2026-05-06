import type { Metadata } from "next";
import { AudioDock } from "@/components/audio/AudioDock";
import { AudioPlayerProvider } from "@/components/audio/AudioPlayerContext";
import { AppChrome } from "@/components/AppChrome";
import { getAllCategories, getAllShows } from "@/lib/content";
import { showsToListEntries } from "@/lib/show-search";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sol Good Media",
    template: "%s | Sol Good Media",
  },
  description: "Podcast network and audio library",
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
    <html lang="en">
      <head>
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
      </body>
    </html>
  );
}
