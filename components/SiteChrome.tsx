import Link from "next/link";

const navBrowse = [
  { href: "/shows", label: "All shows" },
  { href: "/category", label: "Categories" },
  { href: "/blog", label: "Blog" },
  { href: "/products", label: "Products" },
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link href="/" className="site-logo">
            Sol Good Media
          </Link>
          <nav className="site-nav" aria-label="Primary">
            {navBrowse.map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <p>Podcast network and audio library. Audio streams from Spreaker; nothing is re-hosted here.</p>
      </footer>
    </>
  );
}
