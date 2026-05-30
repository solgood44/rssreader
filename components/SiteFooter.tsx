"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NewsletterSignup } from "./NewsletterSignup";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/category" || pathname.startsWith("/category/")) {
    return null;
  }
  const showNewsletter = pathname !== "/blog" && pathname !== "/about";
  return (
    <footer className="site-footer">
      {showNewsletter ? <NewsletterSignup variant="compact" className="site-footer__newsletter" /> : null}
      <nav className="site-footer__nav" aria-label="Footer">
        <Link href="/about">About</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/shows">All shows</Link>
      </nav>
    </footer>
  );
}
