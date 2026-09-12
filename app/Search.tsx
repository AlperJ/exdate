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
    // A Solana address gets a wallet statement; anything else is treated as a ticker.
    const path = BASE58.test(v)
      ? `/wallet/${v}`
      : `/asset/${encodeURIComponent(v.replace(/^\$/, "").toUpperCase().replace(/X$/, "x"))}`;
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
          placeholder="Solana wallet address, or a ticker like AAPLx"
          spellCheck={false}
          autoComplete="off"
        />
        <button type="submit" disabled={pending || !q.trim()}>
          {pending ? "Reading…" : "Show me"}
        </button>
      </form>
      <p className="hint">
        No wallet needed. Try{" "}
        <a onClick={() => { setQ("AAPLx"); go("AAPLx"); }}>AAPLx</a>,{" "}
        <a onClick={() => { setQ("NVDAx"); go("NVDAx"); }}>NVDAx</a>,{" "}
        <a onClick={() => { setQ("SPYx"); go("SPYx"); }}>SPYx</a> or{" "}
        <a onClick={() => { setQ("MSTRx"); go("MSTRx"); }}>MSTRx</a>.
      </p>
    </>
  );
}
