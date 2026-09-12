// Minimal Solana JSON-RPC client. No SDK: token reads only need jsonParsed responses.
export const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export function rpcUrl(): string {
  return (
    process.env.SOLANA_RPC_URL ??
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
    "https://api.mainnet-beta.solana.com"
  );
}

let id = 0;
export async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(rpcUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
    cache: "no-store",
  });
  const j = (await res.json()) as { result?: T; error?: { message: string; code: number } };
  if (j.error) throw new Error(`RPC ${method}: ${j.error.message} (${j.error.code})`);
  return j.result as T;
}

export type ScaledConfig = {
  authority: string;
  multiplier: string;
  newMultiplier: string;
  newMultiplierEffectiveTimestamp: number;
};

export type MintInfo = {
  decimals: number;
  supplyRaw: string;
  scaled: ScaledConfig | null;
  paused: boolean | null;
  permanentDelegate: string | null;
  transferHookProgram: string | null;
};

/**
 * THE TRAP.
 *
 * Token-2022's ScaledUiAmountConfig carries two values. The field literally named
 * `multiplier` is the OLD one; `newMultiplier` takes over once
 * `newMultiplierEffectiveTimestamp` has passed. Once a corporate action activates,
 * the chain does NOT rewrite `multiplier` -- it just leaves the stale value sitting
 * there with a past timestamp.
 *
 * Verified on AAPLx, 2026-09-12:
 *   multiplier                      = 1.0026642075893797   <- stale, looks authoritative
 *   newMultiplier                   = 1.0032690125398187   <- actually in force
 *   newMultiplierEffectiveTimestamp = 1786149000 (2026-08-08, in the past)
 *
 * Read `multiplier` naively and every balance you show is wrong. For a cash dividend
 * the error is small. For a 10:1 split it is 10x.
 */
export function effectiveMultiplier(c: ScaledConfig | null, nowSec = Date.now() / 1000): number {
  if (!c) return 1;
  const ts = Number(c.newMultiplierEffectiveTimestamp ?? 0);
  const next = Number(c.newMultiplier);
  if (ts > 0 && Number.isFinite(next) && next > 0 && nowSec >= ts) return next;
  const cur = Number(c.multiplier);
  return Number.isFinite(cur) && cur > 0 ? cur : 1;
}

/** What a naive integration shows: the stale `multiplier` field, taken at face value. */
export function naiveMultiplier(c: ScaledConfig | null): number {
  if (!c) return 1;
  const cur = Number(c.multiplier);
  return Number.isFinite(cur) && cur > 0 ? cur : 1;
}

/** A multiplier change that is scheduled but not yet in force. */
export function pendingChange(c: ScaledConfig | null, nowSec = Date.now() / 1000) {
  if (!c) return null;
  const ts = Number(c.newMultiplierEffectiveTimestamp ?? 0);
  if (!ts || nowSec >= ts) return null;
  return {
    from: Number(c.multiplier),
    to: Number(c.newMultiplier),
    activatesAt: new Date(ts * 1000),
    secondsAway: ts - nowSec,
  };
}

type ParsedMint = {
  value: {
    owner: string;
    data: {
      parsed: {
        info: {
          decimals: number;
          supply: string;
          extensions?: { extension: string; state: Record<string, unknown> }[];
        };
      };
    };
  } | null;
};

export async function fetchMint(mint: string): Promise<MintInfo | null> {
  const r = await rpc<ParsedMint>("getAccountInfo", [mint, { encoding: "jsonParsed" }]);
  const info = r?.value?.data?.parsed?.info;
  if (!info) return null;
  const ext = (name: string) =>
    info.extensions?.find((e) => e.extension === name)?.state as Record<string, unknown> | undefined;

  const s = ext("scaledUiAmountConfig");
  const p = ext("pausableConfig");
  const pd = ext("permanentDelegate");
  const th = ext("transferHook");

  return {
    decimals: info.decimals,
    supplyRaw: info.supply,
    scaled: s
      ? {
          authority: String(s.authority ?? ""),
          multiplier: String(s.multiplier ?? "1"),
          newMultiplier: String(s.newMultiplier ?? "0"),
          newMultiplierEffectiveTimestamp: Number(s.newMultiplierEffectiveTimestamp ?? 0),
        }
      : null,
    paused: p ? Boolean(p.paused) : null,
    permanentDelegate: pd ? String(pd.delegate ?? "") || null : null,
    transferHookProgram: th && th.programId ? String(th.programId) : null,
  };
}

export type TokenHolding = { mint: string; tokenAccount: string; rawAmount: string; decimals: number };

/** Token-2022 holdings for a wallet. */
export async function fetchHoldings(owner: string): Promise<TokenHolding[]> {
  const r = await rpc<{
    value: {
      pubkey: string;
      account: { data: { parsed: { info: { mint: string; tokenAmount: { amount: string; decimals: number } } } } };
    }[];
  }>("getTokenAccountsByOwner", [owner, { programId: TOKEN_2022 }, { encoding: "jsonParsed" }]);

  return (r?.value ?? [])
    .map((a) => ({
      mint: a.account.data.parsed.info.mint,
      tokenAccount: a.pubkey,
      rawAmount: a.account.data.parsed.info.tokenAmount.amount,
      decimals: a.account.data.parsed.info.tokenAmount.decimals,
    }))
    .filter((h) => h.rawAmount !== "0");
}

/** Oldest block time we can see for a token account: when the holder first showed up. */
export async function firstSeen(tokenAccount: string, maxPages = 8): Promise<Date | null> {
  let before: string | undefined;
  let oldest: number | null = null;
  for (let i = 0; i < maxPages; i++) {
    const sigs = await rpc<{ signature: string; blockTime: number | null }[]>(
      "getSignaturesForAddress",
      [tokenAccount, { limit: 1000, ...(before ? { before } : {}) }]
    );
    if (!sigs?.length) break;
    for (const s of sigs) if (s.blockTime) oldest = oldest === null ? s.blockTime : Math.min(oldest, s.blockTime);
    if (sigs.length < 1000) break;
    before = sigs[sigs.length - 1].signature;
  }
  return oldest ? new Date(oldest * 1000) : null;
}
