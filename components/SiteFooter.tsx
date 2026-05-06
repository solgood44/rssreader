"use client";

import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/category" || pathname.startsWith("/category/")) {
    return null;
  }
  return (
    <footer className="site-footer">
      <p>Podcast network and audio library. Audio streams from Spreaker; nothing is re-hosted here.</p>
    </footer>
  );
}
