/**
 * Skeletons mirror the geometry of what is loading: a 34px row grid with the same
 * rule as a real table, one block per column at that column's width.
 */
export default function Skeleton({
  columns,
  rows = 8,
  caption,
}: {
  columns: string;
  rows?: number;
  caption: string;
}) {
  const widths = ["60%", "40%", "30%", "45%", "35%", "50%"];
  const count = columns.split(" ").length;

  return (
    <>
      <div className="sk mt-8">
        <div className="sk-block sk-head" />
        <div className="sk-block sk-figure" />
      </div>
      <div className="sk mt-8">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="sk-row" style={{ gridTemplateColumns: columns }}>
            {Array.from({ length: count }, (_, c) => (
              <div key={c} className="sk-block" style={{ width: widths[c % widths.length] }} />
            ))}
          </div>
        ))}
      </div>
      <p className="empty__sub mt-4">
        {caption}
      </p>
    </>
  );
}
