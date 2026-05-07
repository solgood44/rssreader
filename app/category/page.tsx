import type { Metadata } from "next";
import Link from "next/link";
import { getAllCategories } from "@/lib/content";

export const metadata: Metadata = {
  title: "Categories",
  description: "Explore podcasts by topic — health, stories, daily shows, sleep, and more.",
  alternates: { canonical: "/category" },
};

export default function CategoriesIndexPage() {
  const cats = getAllCategories().sort((a, b) => a.data.title.localeCompare(b.data.title));
  return (
    <div>
      <h1 className="hero__title">Categories</h1>
      <p className="hero__lede">Browse shows by the same category tags used in the Grav site.</p>
      <ul className="blog-index">
        {cats.map((c) => (
          <li key={c.slug}>
            <h2 className="blog-index__title">
              <Link href={`/category/${c.slug}`}>{c.data.title}</Link>
            </h2>
          </li>
        ))}
      </ul>
    </div>
  );
}
