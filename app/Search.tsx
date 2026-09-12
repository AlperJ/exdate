"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export default function Search({ initial = "" }: { initial?: string }) {
  const [q, setQ] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();

  function go(value: string) {
    const v = value.trim();
    if (!v) return;
    // A Solana address gets a wallet statement; anything else goes to the server, which
    // resolves it against all 832 assets. Guessing the token symbol here is what made
    // "AAPL" and "CVX" dead ends.
    const path = BASE58.test(v) ? `/wallet/${v}` : `/asset/${encodeURIComponent(v)}`;
    start(() => router.push(path));
  }

  return (
    <>
      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="A stock like AAPL, or a Solana wallet address"
          spellCheck={false}
          autoComplete="off"
        />
        <button type="submit" disabled={pending || !q.trim()}>
          {pending ? "Reading…" : "Show me"}
        </button>
      </form>
      <p className="hint">
        No wallet needed. Try{" "}
        <a onClick={() => { setQ("AAPL"); go("AAPL"); }}>AAPL</a>,{" "}
        <a onClick={() => { setQ("PYPL"); go("PYPL"); }}>PYPL</a>,{" "}
        <a onClick={() => { setQ("NFLX"); go("NFLX"); }}>NFLX</a> or{" "}
        <a onClick={() => { setQ("PFE"); go("PFE"); }}>PFE</a>.
      </p>
    </>
  );
}
