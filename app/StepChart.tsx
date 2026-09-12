"use client";

import { useId, useState } from "react";

export type Point = { at: string; value: number; label?: string };

/**
 * Formatters are named rather than passed: a function cannot cross the server to
 * client boundary, and the set of ways this product formats a number is small.
 */
const FORMATTERS = {
  usd: (n: number) =>
    n >= 1e6
      ? `$${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}m`
      : n >= 1e3
        ? `$${Math.round(n / 1e3)}k`
        : `$${Math.round(n)}`,
  pct: (n: number) => `${n.toFixed(n >= 10 ? 0 : 2)}%`,
  count: (n: number) => Math.round(n).toLocaleString("en-US"),
} as const;

/**
 * A step chart, because a multiplier does not drift: it sits flat and then jumps on
 * the day a corporate action activates. Drawing it as a smooth line would invent
 * movement on days when nothing happened.
 *
 * One series, so no legend: the caption says what is plotted. Only the last point
 * carries a direct label; the axis and the hover tooltip carry the rest.
 */
export default function StepChart({
  points,
  format = "usd",
  height = 180,
  ticks = 4,
  caption,
}: {
  points: Point[];
  format?: keyof typeof FORMATTERS;
  height?: number;
  ticks?: number;
  caption?: string;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const fmt = FORMATTERS[format];

  if (points.length < 2) return null;

  // Room for the y labels on the left and the x band underneath, so nothing is clipped.
  const W = 720;
  const padL = 8;
  const padR = 92;
  const padT = 12;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = height - padT - padB;

  const xs = points.map((p) => +new Date(p.at));
  const x0 = xs[0];
  const x1 = xs[xs.length - 1];
  const span = Math.max(1, x1 - x0);
  const vmax = Math.max(...points.map((p) => p.value));
  // Pick a round step first and let the top follow, so ticks read 0 / 5m / 10m
  // rather than the 6.3m / 13m / 19m a divided-down maximum produces.
  const step = niceStep(vmax / ticks);
  const top = step * Math.max(1, Math.ceil(vmax / step));

  const X = (t: number) => padL + ((t - x0) / span) * plotW;
  const Y = (v: number) => padT + plotH - (v / top) * plotH;

  // Step path: hold the previous value until the moment the next one activates.
  let d = `M ${X(xs[0])} ${Y(points[0].value)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${X(xs[i])} ${Y(points[i - 1].value)} L ${X(xs[i])} ${Y(points[i].value)}`;
  }
  const area = `${d} L ${X(x1)} ${padT + plotH} L ${X(x0)} ${padT + plotH} Z`;

  const last = points[points.length - 1];
  const endY = Y(last.value);
  // A tick sitting under the end label is noise, and the anti-pattern list is explicit
  // that labels must not collide. Drop the tick rather than nudging the label off its mark.
  const gridValues = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => step * i).filter(
    (v) => Math.abs(Y(v) - endY) > 13
  );
  const active = hover === null ? null : points[hover];

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="chart__svg"
        role="img"
        aria-label={caption ?? "Cumulative amount paid over time"}
        onMouseLeave={() => setHover(null)}
      >
        {gridValues.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={padL + plotW} y1={Y(v)} y2={Y(v)} className="chart__grid" />
            <text x={padL + plotW + 8} y={Y(v) + 4} className="chart__tick">
              {fmt(v)}
            </text>
          </g>
        ))}

        <path d={area} className="chart__area" />
        <path d={d} className="chart__line" />

        {/* Hit targets are far larger than the marks, so hovering is not a game of skill. */}
        {points.map((p, i) => (
          <rect
            key={`${id}-${i}`}
            x={i === 0 ? padL : (X(xs[i - 1]) + X(xs[i])) / 2}
            y={padT}
            width={Math.max(
              6,
              (i === points.length - 1 ? padL + plotW : (X(xs[i]) + X(xs[i + 1])) / 2) -
                (i === 0 ? padL : (X(xs[i - 1]) + X(xs[i])) / 2)
            )}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {active ? (
          <g>
            <line
              x1={X(+new Date(active.at))}
              x2={X(+new Date(active.at))}
              y1={padT}
              y2={padT + plotH}
              className="chart__crosshair"
            />
            <circle
              cx={X(+new Date(active.at))}
              cy={Y(active.value)}
              r={4}
              className="chart__dot"
            />
          </g>
        ) : null}

        <circle cx={X(x1)} cy={Y(last.value)} r={4} className="chart__dot" />
        <text x={X(x1) + 10} y={Y(last.value) + 4} className="chart__endlabel">
          {fmt(last.value)}
        </text>

        <text x={padL} y={height - 8} className="chart__tick chart__tick--x">
          {monthLabel(points[0].at)}
        </text>
        <text x={padL + plotW} y={height - 8} className="chart__tick chart__tick--x" textAnchor="end">
          {monthLabel(last.at)}
        </text>
      </svg>

      <figcaption className="chart__cap">
        {active ? (
          <>
            <b>{monthLabel(active.at)}</b> · {fmt(active.value)}
            {active.label ? ` · ${active.label}` : ""}
          </>
        ) : (
          (caption ?? "")
        )}
      </figcaption>
    </figure>
  );
}

/** The smallest of 1, 2, 2.5, 5, 10 times a power of ten that is at least `v`. */
function niceStep(v: number) {
  if (!(v > 0)) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const n = v / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}

function monthLabel(at: string) {
  const d = new Date(at.length === 7 ? `${at}-01T00:00:00Z` : at);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
