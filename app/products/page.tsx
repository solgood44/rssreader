import Link from "next/link";
import { getAllProducts } from "@/lib/content";

export const metadata = { title: "Products" };

/** Lightweight affiliate / product hub — add markdown files under /content/products. */
export default function ProductsIndexPage() {
  const products = getAllProducts();
  return (
    <div>
      <h1 className="hero__title">Products</h1>
      <p className="hero__lede">Curated picks and affiliate links. Content lives in markdown for easy edits.</p>
      {products.length === 0 ? (
        <p className="section-sub">No products yet. Add <code>content/products/your-slug.md</code>.</p>
      ) : (
        <ul className="blog-index">
          {products.map((p) => (
            <li key={p.slug}>
              <h2 className="blog-index__title">
                <Link href={`/products/${p.slug}`}>{p.data.title}</Link>
              </h2>
              {p.data.description ? <p className="section-sub">{p.data.description}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
