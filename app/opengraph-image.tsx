import { ImageResponse } from "next/og";
import market from "@/data/market.json";

export const alt = "ExDate — corporate actions on tokenized US equities";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#26241f";
const GROUND = "#f5f4f1";
const MUTED = "#6b665e";
const RULE = "#c3bdb2";

export default async function Image() {
  const total = market.totalHiddenUsd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const footLeft = `${market.dividendPayments} dividends · ${market.assetCount} assets`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: GROUND,
          color: INK,
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* The mark, drawn as three divs because the OG renderer takes no SVG paths. */}
          <div style={{ display: "flex", position: "relative", width: 64, height: 52 }}>
            <div style={{ position: "absolute", left: 8, top: 36, width: 11, height: 8, background: INK }} />
            <div style={{ position: "absolute", left: 20, top: 22, width: 23, height: 8, background: INK }} />
            <div style={{ position: "absolute", left: 44, top: 8, width: 12, height: 8, background: INK }} />
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 600 }}>ExDate</div>
          <div style={{ width: 1, height: 28, background: RULE, marginLeft: 8 }} />
          <div style={{ display: "flex", fontSize: 22, color: MUTED, marginLeft: 8 }}>
            Corporate actions on tokenized US equities
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 96 }}>
          <div style={{ display: "flex", fontSize: 24, color: MUTED }}>
            Paid into Solana wallets without a transaction
          </div>
          <div style={{ display: "flex", fontSize: 112, fontWeight: 600, marginTop: 12, letterSpacing: -2 }}>
            {total}
          </div>
          <div style={{ width: "100%", height: 1, background: RULE, marginTop: 28 }} />
          <div style={{ display: "flex", fontSize: 26, color: MUTED, marginTop: 28, lineHeight: 1.4, maxWidth: 900 }}>
            xStocks pay dividends by raising a Token-2022 multiplier. Token counts never change and no wallet reports it.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            fontSize: 20,
            color: MUTED,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex" }}>{footLeft}</div>
          <div style={{ display: "flex" }}>exdate-ten.vercel.app</div>
        </div>
      </div>
    ),
    size
  );
}
