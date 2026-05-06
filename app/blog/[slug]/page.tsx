import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllBlogPosts, getBlogPost } from "@/lib/content";
import { Markdown } from "@/components/Markdown";
import { OptimizedCover } from "@/components/OptimizedCover";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllBlogPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.data.title,
    description: post.data.metadata?.description || post.data.summary,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const hero = post.data.header?.hero_image;

  return (
    <article>
      <p className="back">
        <Link href="/blog">← Blog</Link>
      </p>
      <header>
        <h1 className="hero__title">{post.data.title}</h1>
        {post.data.date ? (
          <p className="section-sub">
            <time dateTime={post.data.date}>{new Date(post.data.date).toLocaleDateString()}</time>
          </p>
        ) : null}
      </header>
      {hero ? (
        <figure className="blog-hero">
          <OptimizedCover
            src={hero}
            alt={post.data.header?.hero_image_alt || ""}
            width={1600}
            height={1000}
            sizes="(max-width: 1100px) 100vw, 1100px"
            responsive
            priority
          />
        </figure>
      ) : null}
      <Markdown source={post.body} />
    </article>
  );
}
