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
  const TIMELINE_PAGE = 1000;
  const sigs = await rpc<{ signature: string; blockTime: number | null }[]>(
    "getSignaturesForAddress",
    [tokenAccount, { limit: TIMELINE_PAGE }]
  );
  if (!sigs?.length || sigs.length >= TIMELINE_PAGE) return null;
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

/**
 * Several calls in one request. JSON-RPC 2.0 takes an array and Solana endpoints honour
 * it, which turns a position's whole transaction history into a single round trip
 * instead of sixty. One wallet took 41 seconds before this and 6 after.
 */
export async function rpcBatch<T>(calls: { method: string; params: unknown[] }[], attempt = 0): Promise<(T | null)[]> {
  if (!calls.length) return [];
  const body = calls.map((c, i) => ({ jsonrpc: "2.0", id: i, method: c.method, params: c.params }));
  const res = await slot(() =>
    fetch(rpcUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
  );
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 6) throw new Error(`RPC batch: rate limited after ${attempt} retries`);
    await sleep(300 * 2 ** attempt + Math.random() * 200);
    return rpcBatch<T>(calls, attempt + 1);
  }
  const text = await res.text();
  let arr: { id: number; result?: T; error?: unknown }[];
  try {
    arr = JSON.parse(text);
  } catch {
    throw new Error(`RPC batch: ${res.status} ${text.slice(0, 90)}`);
  }
  if (!Array.isArray(arr)) throw new Error("RPC batch: endpoint did not return an array");
  const out: (T | null)[] = new Array(calls.length).fill(null);
  for (const r of arr) if (typeof r.id === "number" && !r.error) out[r.id] = (r.result ?? null) as T | null;
  return out;
}

export type BalancePoint = { at: number; raw: number };

/**
 * The balance a token account actually held over time.
 *
 * Applying today's balance to a payment from eight months ago is wrong whenever the
 * holder bought or sold in between, and it is wrong in both directions: on one test
 * wallet 18 of 28 payment rows used a balance that was never held at the time, the worst
 * overstating a single row 151-fold.
 *
 * The timeline is rebuilt from the account's own transactions, reading the post-balance
 * each one left behind. Only history older than the first payment we have to price is
 * worth fetching, so `since` stops the walk there: an account with nine years of trades
 * and one dividend last month costs a single page, not ninety.
 *
 * Where the walk runs out before reaching that point, `coveredFrom` says so and the
 * caller marks those rows estimated rather than quietly using today's balance.
 */
export type Timeline = { points: BalancePoint[]; coveredFrom: number };

const TIMELINE_PAGE = 100;
const TIMELINE_CAP = 600; // deeper than this buys a handful of rows for ten more seconds

export async function balanceTimeline(
  tokenAccount: string,
  when: number[]
): Promise<Timeline | null> {
  if (!when.length) return { points: [], coveredFrom: 0 };
  const since = when[0];

  type Sig = { signature: string; blockTime: number | null; err: unknown };
  const sigs: Sig[] = [];
  let before: string | undefined;
  let reachedStart = false;

  while (sigs.length < TIMELINE_CAP) {
    const page = await rpc<Sig[]>("getSignaturesForAddress", [
      tokenAccount,
      { limit: TIMELINE_PAGE, ...(before ? { before } : {}) },
    ]);
    if (!page?.length) {
      reachedStart = true;
      break;
    }
    sigs.push(...page);
    const last = page[page.length - 1];
    before = last.signature;
    if (page.length < TIMELINE_PAGE) {
      reachedStart = true;
      break;
    }
    // One transaction at or before the first payment fixes the opening balance; the
    // rest of the account's history cannot change what it held that day.
    if (last.blockTime && last.blockTime * 1000 <= since) break;
  }

  const ok = sigs.filter((s) => !s.err && s.blockTime); // newest first
  if (!ok.length) return { points: [], coveredFrom: 0 };
  const oldest = (ok[ok.length - 1].blockTime as number) * 1000;
  const coveredFrom = reachedStart ? 0 : oldest;

  // Only the transaction immediately before a payment sets that payment's basis, so
  // read those and nothing else. A busy account with four dividends costs four reads
  // rather than six hundred, which is the difference between a page that loads and a
  // page that gets rate limited into guessing.
  const wanted = new Set<string>();
  for (const t of when) {
    const s = ok.find((x) => (x.blockTime as number) * 1000 <= t);
    if (s) wanted.add(s.signature);
  }
  if (!wanted.size) return { points: [], coveredFrom };

  let txs: ({ blockTime: number | null; meta: { err: unknown } | null } | null)[];
  try {
    txs = await rpcBatch<{ blockTime: number | null; meta: { err: unknown } | null }>(
      [...wanted].map((signature) => ({
        method: "getTransaction",
        params: [signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
      }))
    );
  } catch {
    return null;
  }

  const points: BalancePoint[] = [];
  for (const tx of txs) {
    if (!tx?.meta || tx.meta.err) continue;
    const raw = pickBalance(tx, tokenAccount);
    if (raw !== null && tx.blockTime) points.push({ at: tx.blockTime * 1000, raw });
  }
  points.sort((a, b) => a.at - b.at);
  return { points, coveredFrom };
}

/** The balance this account was left holding by a transaction, raw units. */
function pickBalance(tx: unknown, tokenAccount: string): number | null {
  const t = tx as {
    transaction?: { message?: { accountKeys?: ({ pubkey?: string } | string)[] } };
    meta?: { postTokenBalances?: { accountIndex?: number; uiTokenAmount?: { amount?: string } }[] };
  };
  const keys = t.transaction?.message?.accountKeys ?? [];
  const idx = keys.findIndex((k) => (typeof k === "string" ? k : k?.pubkey) === tokenAccount);
  if (idx < 0) return null;
  const bal = t.meta?.postTokenBalances?.find((p) => p.accountIndex === idx);
  const amt = bal?.uiTokenAmount?.amount;
  return amt === undefined ? null : Number(amt);
}

export function balanceAt(points: BalancePoint[], when: number): number {
  let held = 0;
  for (const p of points) {
    if (p.at <= when) held = p.raw;
    else break;
  }
  return held;
}
