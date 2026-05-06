import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCategories, getCategory, showsForCategory } from "@/lib/content";
import { showsToListEntries } from "@/lib/show-search";
import { ShowCard } from "@/components/ShowCard";
import { Markdown } from "@/components/Markdown";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) return {};
  return { title: cat.data.title };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat || !cat.data.category_match) notFound();

  const shows = showsToListEntries(showsForCategory(cat.data.category_match)).sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
  );

  return (
    <div>
      <p className="back">
        <Link href="/category">← Categories</Link>
      </p>
      <h1 className="hero__title">{cat.data.title}</h1>
      {cat.body ? (
        <div className="hero__lede hero__lede--md">
          <Markdown source={cat.body} />
        </div>
      ) : null}
      <p className="section-sub">
        {shows.length} shows tagged “{cat.data.category_match.replace(/\*\*/g, "").trim()}”.
      </p>
      <div className="card-grid">
        {shows.map((s) => (
          <ShowCard key={s.slug} show={s} />
        ))}
      </div>
    </div>
  );
}
