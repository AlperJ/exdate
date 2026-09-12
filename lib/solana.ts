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

// Free RPC tiers sit around 10 requests a second, and a wallet report fans out hard.
// Cap concurrency and back off on 429 rather than letting the whole page fail.
const MAX_INFLIGHT = 4;
let inflight = 0;
const queue: (() => void)[] = [];

async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (inflight >= MAX_INFLIGHT) await new Promise<void>((r) => queue.push(r));
  inflight++;
  try {
    return await fn();
  } finally {
    inflight--;
    queue.shift()?.();
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function rpc<T>(method: string, params: unknown[], attempt = 0): Promise<T> {
  const res = await slot(() =>
    fetch(rpcUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
      cache: "no-store",
    })
  );

  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 4) throw new Error(`RPC ${method}: rate limited after ${attempt} retries`);
    await sleep(250 * 2 ** attempt + Math.random() * 120);
    return rpc<T>(method, params, attempt + 1);
  }

  const text = await res.text();
  let j: { result?: T; error?: { message: string; code: number } };
  try {
    j = JSON.parse(text);
  } catch {
    throw new Error(`RPC ${method}: ${res.status} ${text.slice(0, 90)}`);
  }
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

/**
 * When this token account first appeared, or null if we cannot say cheaply.
 *
 * Signatures come back newest first, so finding the true first one means walking the
 * whole history. That is fine for a personal wallet and ruinous for an AMM pool with
 * hundreds of thousands of transactions. Walk one page: if it is not full, the oldest
 * entry is genuinely the first. If it is full, give up and let the caller show the
 * asset's full payout history instead of inventing a start date.
 */
export async function firstSeen(tokenAccount: string): Promise<Date | null> {
  const PAGE = 1000;
  const sigs = await rpc<{ signature: string; blockTime: number | null }[]>(
    "getSignaturesForAddress",
    [tokenAccount, { limit: PAGE }]
  );
  if (!sigs?.length || sigs.length >= PAGE) return null;
  const oldest = sigs.reduce<number | null>(
    (min, s) => (s.blockTime && (min === null || s.blockTime < min) ? s.blockTime : min),
    null
  );
  return oldest ? new Date(oldest * 1000) : null;
}

export type LargestAccount = { address: string; amount: string; uiAmountString: string };

/**
 * Tokens the issuer has minted but not yet sold.
 *
 * The issuer's own float sits in ordinary token accounts owned by the same key that
 * controls the ScaledUiAmount extension. Subtract it from total supply and you get
 * circulating supply computed from the chain, which can be checked against the number
 * the issuer publishes rather than taken on trust.
 *
 * Two RPC calls: largest accounts, then every owner in one getMultipleAccounts.
 */
export async function treasuryHeld(mint: string, authority: string | null): Promise<number | null> {
  if (!authority) return null;
  try {
    const largest = await rpc<{ value: LargestAccount[] }>("getTokenLargestAccounts", [mint]);
    const accts = largest?.value ?? [];
    if (!accts.length) return null;

    const infos = await rpc<{
      value: ({ data: { parsed: { info: { owner: string; tokenAmount: { uiAmount: number } } } } } | null)[];
    }>("getMultipleAccounts", [accts.map((a) => a.address), { encoding: "jsonParsed" }]);

    let held = 0;
    (infos?.value ?? []).forEach((acc) => {
      const info = acc?.data?.parsed?.info;
      if (info && info.owner === authority) held += info.tokenAmount.uiAmount ?? 0;
    });
    return held;
  } catch {
    return null; // needs a real RPC; public endpoints block getTokenLargestAccounts
  }
}

/** Many mints in one call. 644 positions should not mean 644 round trips. */
export async function fetchMints(mints: string[]): Promise<Map<string, MintInfo>> {
  const out = new Map<string, MintInfo>();
  for (let i = 0; i < mints.length; i += 100) {
    const chunk = mints.slice(i, i + 100);
    const r = await rpc<{
      value: ({
        data: {
          parsed: {
            info: {
              decimals: number;
              supply: string;
              extensions?: { extension: string; state: Record<string, unknown> }[];
            };
          };
        };
      } | null)[];
    }>("getMultipleAccounts", [chunk, { encoding: "jsonParsed" }]);

    (r?.value ?? []).forEach((acc, idx) => {
      const info = acc?.data?.parsed?.info;
      if (!info) return;
      const ext = (name: string) =>
        info.extensions?.find((e) => e.extension === name)?.state as Record<string, unknown> | undefined;
      const s = ext("scaledUiAmountConfig");
      const p = ext("pausableConfig");
      const pd = ext("permanentDelegate");
      const th = ext("transferHook");
      out.set(chunk[idx], {
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
      });
    });
  }
  return out;
}
