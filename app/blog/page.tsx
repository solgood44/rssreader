import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { getAllBlogPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description: "News, listening tips, and articles from the Podcast library.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts().sort((a, b) => {
    const da = a.data.date ? new Date(a.data.date).getTime() : 0;
    const db = b.data.date ? new Date(b.data.date).getTime() : 0;
    return db - da;
  });

  return (
    <div>
      <h1 className="hero__title">Blog</h1>
      <p className="hero__lede">Network news, listening tips, and longer-form updates.</p>

      <NewsletterSignup variant="prominent" className="newsletter-signup--page" />

      <ul className="blog-index">
        {posts.map((p) => (
          <li key={p.slug}>
            {p.data.date ? (
              <div className="blog-index__meta">{new Date(p.data.date).toLocaleDateString()}</div>
            ) : null}
            <h2 className="blog-index__title">
              <Link href={`/blog/${p.slug}`}>{p.data.title}</Link>
            </h2>
            {p.data.summary || p.data.metadata?.description ? (
              <p className="section-sub" style={{ margin: "0.5rem 0 0" }}>
                {p.data.summary || p.data.metadata?.description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
