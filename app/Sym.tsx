/**
 * A ticker with its logo tile, used in the first cell of every table.
 *
 * The logo URL is derived rather than stored: the issuer serves every mark at a
 * predictable path, verified across ordinary tickers, Hong Kong listings and share
 * classes with a dot in them. That keeps the snapshot free of 832 duplicate strings.
 *
 * A missing or slow image leaves the tile's sunken fill in place rather than
 * collapsing the row, so the column never shifts while images load.
 */
export function logoFor(symbol: string) {
  return `https://xstocks-metadata.backed.fi/logos/tokens/${encodeURIComponent(symbol)}.png`;
}

export default function Sym({
  symbol,
  href,
  sub,
}: {
  symbol: string;
  href?: string;
  sub?: string;
}) {
  const label = href ? (
    <a className="cell__main" href={href}>
      {symbol}
    </a>
  ) : (
    <span className="cell__main">{symbol}</span>
  );

  return (
    <span className="cell__id">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="mark mark--sm" src={logoFor(symbol)} alt="" width={20} height={20} loading="lazy" />
      <span>
        {label}
        {sub ? <span className="cell__sub">{sub}</span> : null}
      </span>
    </span>
  );
}
