"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/category" || pathname.startsWith("/category/")) {
    return null;
  }
  return (
    <footer className="site-footer">
      <nav className="site-footer__nav" aria-label="Footer">
        <Link href="/about">About</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/shows">All shows</Link>
      </nav>
    </footer>
  );
}
