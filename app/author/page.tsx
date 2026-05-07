import type { Metadata } from "next";
import Link from "next/link";
import { getAllAuthors } from "@/lib/authors";

export const metadata: Metadata = {
  title: "Authors",
  description: "Browse authors and listen to their podcasts and audiobooks.",
  alternates: { canonical: "/author" },
};

export default function AuthorsIndexPage() {
  const authors = getAllAuthors();

  return (
    <div>
      <h1 className="hero__title">Authors</h1>
      <p className="hero__lede">
        Authors are detected from show titles (for example: “by Jane Austen” or “- H.G. Wells”) and sorted by how many
        podcasts they have.
      </p>
      <ul className="blog-index">
        {authors.map((a) => (
          <li key={a.slug}>
            <h2 className="blog-index__title">
              <Link href={`/author/${a.slug}`}>{a.name}</Link>
            </h2>
            <div className="blog-index__meta">{a.showSlugs.length} podcasts</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

