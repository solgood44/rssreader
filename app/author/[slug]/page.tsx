import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllAuthors, getAuthor } from "@/lib/authors";
import { ShowCard } from "@/components/ShowCard";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllAuthors().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (!author) return {};
  const description = author.blurb || `Listen to podcasts by ${author.name}.`;
  return {
    title: author.name,
    description,
    alternates: { canonical: `/author/${author.slug}` },
    openGraph: {
      title: author.name,
      description,
      url: `/author/${author.slug}`,
    },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (!author) notFound();

  return (
    <div>
      <p className="back">
        <Link href="/author">← Authors</Link>
      </p>
      <h1 className="hero__title">{author.name}</h1>
      <p className="hero__lede">{author.blurb}</p>
      <p className="section-sub">{author.shows.length} podcasts</p>
      <div className="card-grid">
        {author.shows.map((s) => (
          <ShowCard key={s.slug} show={s} />
        ))}
      </div>
    </div>
  );
}

