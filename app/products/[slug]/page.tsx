import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProducts, getProduct } from "@/lib/content";
import { Markdown } from "@/components/Markdown";
import { OptimizedCover } from "@/components/OptimizedCover";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  return { title: p.data.title, description: p.data.description };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();

  return (
    <article>
      <p className="back">
        <Link href="/products">← Products</Link>
      </p>
      <h1 className="hero__title">{p.data.title}</h1>
      {p.data.description ? <p className="hero__lede">{p.data.description}</p> : null}
      {p.data.image ? (
        <div className="episode-page__cover">
          <OptimizedCover src={p.data.image} alt="" size={480} />
        </div>
      ) : null}
      {p.data.affiliate_url ? (
        <p>
          <a href={p.data.affiliate_url} target="_blank" rel="nofollow sponsored noreferrer">
            View offer →
          </a>
          {p.data.price_note ? ` · ${p.data.price_note}` : null}
        </p>
      ) : null}
      <Markdown source={p.body} />
    </article>
  );
}
