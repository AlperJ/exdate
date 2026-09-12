"use client";

import { useState } from "react";
import { usd, num, pct, signed, day } from "@/lib/fmt";
import type { PositionReport } from "@/lib/report";
import Sym from "@/app/Sym";

export default function Positions({ positions }: { positions: PositionReport[] }) {
  // A single-position wallet has nothing to choose between, so open it.
  const [open, setOpen] = useState<string | null>(
    positions.length === 1 ? positions[0].mint : null
  );

  return (
    <div className="tw">
      <table className="dt">
        <colgroup>
          <col style={{ width: "140px" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "110px" }} />
          <col style={{ width: "80px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "110px" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Tokens</th>
            <th>Value (USD)</th>
            <th>Payments</th>
            <th>Received (USD)</th>
            <th>History</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const isOpen = open === p.mint;
            return [
              <tr key={p.mint}>
                <td>
                  <Sym symbol={p.symbol} href={`/asset/${p.symbol}`} />
                </td>
                <td>{num(p.trueBalance, 4)}</td>
                <td>{p.valueUsd !== null ? usd(p.valueUsd, 0) : "—"}</td>
                <td>{p.paid.length}</td>
                <td className={p.totalUsdGained > 0 ? "pos" : "muted"}>
                  {p.totalUsdGained > 0 ? usd(p.totalUsdGained) : "—"}
                </td>
                <td className="row-actions">
                  {p.paid.length ? (
                    <a
                      onClick={() => setOpen(isOpen ? null : p.mint)}
                      className="link-toggle"
                    >
                      {isOpen ? "Hide" : "Show"}
                    </a>
                  ) : (
                    <span className="muted link-toggle">
                      none
                    </span>
                  )}
                </td>
              </tr>,
              isOpen ? (
                <tr key={`${p.mint}-detail`}>
                  <td colSpan={6} className="detail-cell">
                    <table className="dt dt--compact">
                      <colgroup>
                        <col style={{ width: "112px" }} />
                        <col style={{ width: "150px" }} />
                        <col />
                        <col style={{ width: "130px" }} />
                        <col style={{ width: "110px" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Action</th>
                          <th>Multiplier</th>
                          <th>Tokens gained</th>
                          <th>USD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...p.paid].reverse().map((e, i) => (
                          <tr key={`${p.mint}-${i}`}>
                            <td>{day(e.date)}</td>
                            <td className={e.isIncome ? "" : "muted"}>
                              {e.isIncome
                                ? e.reason
                                : `${e.reason.replace(/([a-z])([A-Z])/g, "$1 $2")} · no gain`}
                            </td>
                            <td className="lit">
                              {e.from.toFixed(9)} → {e.to.toFixed(9)}
                            </td>
                            <td className={e.isIncome ? "pos" : "muted"}>
                              {signed(e.sharesGained, 6)}
                            </td>
                            <td className={e.isIncome ? "" : "muted"}>
                              {e.isIncome && e.usdGained ? usd(e.usdGained) : "—"}
                              {e.isIncome && !e.exact ? (
                                <small className="muted est" title="The chain would not return this account's history, so this row values the payment against today's balance.">
                                  estimated
                                </small>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {p.reserves?.ratio != null ? (
                      <p
                        className="empty__sub detail-note"
                      >
                        Backing {pct(p.reserves.ratio * 100)} at{" "}
                        {p.reserves.providers.join(", ")}.
                      </p>
                    ) : null}
                  </td>
                </tr>
              ) : null,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
