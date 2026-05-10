export default function ShowsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <section className="hero">
        <h1 className="hero__title">All shows</h1>
        <p className="hero__lede">
          Search by title in the header, or browse categories to find something that fits your mood.
        </p>
      </section>
      {children}
    </>
  );
}
