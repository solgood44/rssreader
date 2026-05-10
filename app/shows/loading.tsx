export default function ShowsLoading() {
  return (
    <div className="card-grid" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            minHeight: "14rem",
            borderRadius: 12,
            background: "var(--border, rgba(255,255,255,0.08))",
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}
