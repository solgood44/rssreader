import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getAllCategories,
  getCategory,
  orderShowsByRssAllowlist,
  showsForCategoryConfig,
} from "@/lib/content";
import { getCategoryDirectoryPage, parseCategorySearchParams } from "@/lib/category-directory";
import { showsToListEntries, type ShowListEntry } from "@/lib/show-search";
import { CategoryShowsClient } from "@/components/CategoryShowsClient";
import { Markdown } from "@/components/Markdown";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function CategoryShowsBody({
  shows,
  searchParams,
}: {
  shows: ShowListEntry[];
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { sort, randomSeed, page } = parseCategorySearchParams(sp);
  const directory = getCategoryDirectoryPage(shows, { sort, randomSeed, page });
  return <CategoryShowsClient directory={directory} />;
}

export async function generateStaticParams() {
  return getAllCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) return {};
  const raw = cat.body.replace(/\s+/g, " ").trim();
  const description =
    raw.length > 0 ? raw.slice(0, 160) + (raw.length > 160 ? "…" : "") : `Podcasts in “${cat.data.title}”.`;
  return {
    title: cat.data.title,
    description,
    alternates: { canonical: `/category/${slug}` },
    openGraph: {
      title: cat.data.title,
      description,
      url: `/category/${slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat || (!cat.data.category_match && !(cat.data.category_rss_allowlist?.length ?? 0))) notFound();

  const allow = cat.data.category_rss_allowlist;
  let records = showsForCategoryConfig(cat.data);
  if (allow && allow.length > 0) {
    records = orderShowsByRssAllowlist(records, allow);
  } else {
    records = [...records].sort((a, b) =>
      a.data.title.localeCompare(b.data.title, undefined, { sensitivity: "base" }),
    );
  }
  const shows = showsToListEntries(records);

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
      <Suspense fallback={<p className="section-sub">Loading shows…</p>}>
        <CategoryShowsBody shows={shows} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
