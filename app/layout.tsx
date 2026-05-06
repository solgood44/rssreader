import type { Metadata } from "next";
import { AudioDock } from "@/components/audio/AudioDock";
import { AudioPlayerProvider } from "@/components/audio/AudioPlayerContext";
import { AppChrome } from "@/components/AppChrome";
import { getAllCategories } from "@/lib/content";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sol Good Media",
    template: "%s | Sol Good Media",
  },
  description: "Podcast network and audio library",
};

function navCategories() {
  return getAllCategories()
    .map((c) => ({
      slug: c.slug,
      title: c.data.title || c.slug,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = navCategories();

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
          <AppChrome categories={categories}>{children}</AppChrome>
          <AudioDock />
        </AudioPlayerProvider>
      </body>
    </html>
  );
}
