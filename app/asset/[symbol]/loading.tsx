export default function Loading() {
  return (
    <div style={{ paddingTop: 26 }}>
      <div className="skeleton" style={{ height: 52, maxWidth: 520 }} />
      <div className="skeleton" style={{ height: 150, marginTop: 26 }} />
      <div className="skeleton" style={{ height: 96 }} />
      <div className="skeleton" style={{ height: 230 }} />
      <p className="hint" style={{ marginTop: 18 }}>
        Reading the mint account on mainnet and the issuer&apos;s payout record.
      </p>
    </div>
  );
}
