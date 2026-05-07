import Link from "next/link";

export default function NotFound() {
  return (
    <section className="hero">
      <h1 className="hero__title">That page isn’t here</h1>
      <p className="hero__lede">
        Try searching for a show in the header, or jump back into the library from one of these links.
      </p>
      <div className="hero__cta hero-actions">
        <Link href="/shows" className="hero-actions__primary">
          Browse all shows
        </Link>
        <Link href="/category" className="hero-actions__secondary">
          Explore categories
        </Link>
        <Link href="/recent" className="hero-actions__tertiary">
          Recently listened
        </Link>
      </div>
    </section>
  );
}

