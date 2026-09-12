export default function Loading() {
  return (
    <div style={{ paddingTop: 26 }}>
      <div className="skeleton" style={{ height: 52, maxWidth: 520 }} />
      <div className="skeleton" style={{ height: 160, marginTop: 26 }} />
      <div className="skeleton" style={{ height: 210 }} />
      <div className="skeleton" style={{ height: 210 }} />
      <p className="hint" style={{ marginTop: 18 }}>
        Reading every Token-2022 balance in this wallet, then the payout record for each
        position. A wallet with hundreds of positions takes a few seconds.
      </p>
    </div>
  );
}
