import Link from "next/link";
import { getAllShows } from "@/lib/content";
import { ShowCard } from "@/components/ShowCard";

export const metadata = { title: "Shows" };

const PAGE_SIZE = 48;

type Props = { searchParams: Promise<{ page?: string }> };

export default async function ShowsDirectoryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const all = getAllShows().sort((a, b) =>
    a.data.title.localeCompare(b.data.title, undefined, { sensitivity: "base" }),
  );
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const slice = all.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <h1 className="hero__title">All shows</h1>
      <p className="hero__lede">{all.length} shows · page {safePage} of {totalPages}</p>

      <div className="card-grid">
        {slice.map((s) => (
          <ShowCard key={s.slug} show={s} />
        ))}
      </div>

      <div className="pager-bar">
        {safePage > 1 ? (
          <Link href={safePage === 2 ? "/shows" : `/shows?page=${safePage - 1}`}>← Previous</Link>
        ) : (
          <span />
        )}
        {safePage < totalPages ? <Link href={`/shows?page=${safePage + 1}`}>Next →</Link> : <span />}
      </div>
    </div>
  );
}
