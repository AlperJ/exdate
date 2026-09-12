"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EXAMPLES = ["AAPL", "PYPL", "NFLX", "PFE"];

export default function Search({
  initial = "",
  compact = false,
  examples = true,
}: {
  initial?: string;
  compact?: boolean;
  examples?: boolean;
}) {
  const [q, setQ] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();

  function go(value: string) {
    const v = value.trim();
    if (!v) return;
    // A Solana address gets a statement; anything else is resolved server-side
    // against all 832 assets, which is what stopped "AAPL" and "CVX" being dead ends.
    start(() => router.push(BASE58.test(v) ? `/wallet/${v}` : `/asset/${encodeURIComponent(v)}`));
  }

  return (
    <>
      <form
        className={compact ? "search search--bar" : "search"}
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        role="search"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={compact ? "Ticker or wallet" : "A ticker such as AAPL, or a Solana wallet address"}
          spellCheck={false}
          autoComplete="off"
          aria-label="Ticker or Solana wallet address"
        />
        <button type="submit" disabled={pending || !q.trim()}>
          {pending ? "Reading" : compact ? "Go" : "Look up"}
        </button>
      </form>

      {examples && !compact ? (
        <>
        <p className="search__hint">
          Examples:{" "}
          {EXAMPLES.map((t, i) => (
            <span key={t}>
              {i > 0 ? ", " : ""}
              <a
                onClick={() => {
                  setQ(t);
                  go(t);
                }}
              >
                {t}
              </a>
            </span>
          ))}
        </p>
        <p className="search__hint">
          Bought on an exchange? Your tokens sit in the exchange&apos;s own wallet, so a wallet
          lookup will not find them. Type the ticker instead to see what that stock paid per token.
        </p>
        </>
      ) : null}
    </>
  );
}
