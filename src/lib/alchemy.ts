/**
 * On-chain ERC-20 transfer history via Kalp Wallet API.
 *
 * Endpoint: `GET {KALP_BASE}/transactions/token-transfers`
 * Query params (match Kalp docs):
 * - `address` — wallet address
 * - `chainId` — e.g. `8453` (Base mainnet), `84532`, `1`, `11155111`
 * - `contractAddress` — optional; omit for all ERC-20 tokens
 * - `direction` — optional `from` | `to`; omit for both directions
 * - `page` — page number (1 = most recent)
 *
 * Examples:
 * - Sent, page 2: `...&direction=from&page=2`
 * - Received: `...&direction=to&page=1`
 * - Both + token: omit `direction`, include `contractAddress`
 * - All tokens: omit `contractAddress`, optional `direction`
 */

/** Supported networks (maps to numeric chainId for the Kalp API) */
export type AlchemyNetwork =
  | "eth-sepolia"
  | "base-sepolia"
  | "eth-mainnet"
  | "base-mainnet";

const NETWORK_TO_CHAIN_ID: Record<AlchemyNetwork, string> = {
  "eth-sepolia": "11155111",
  "base-sepolia": "84532",
  "eth-mainnet": "1",
  "base-mainnet": "8453",
};

/** Normalized ERC20 transfer format */
export interface NormalizedTransfer {
  from: string;
  to: string;
  amount: number;
  hash: string;
  /** Block number (hex or decimal string). */
  blockNum?: string;
  /** ISO timestamp when available. */
  blockTimestamp?: string;
}

/** Totals from calculateTotals */
export interface TransferTotals {
  sent: number;
  received: number;
}

/** MPC/platform fee legs (same tx hash as user send); exclude from UI and totals */
const PLATFORM_FEE_TO_ADDRESSES_LOWER = new Set([
  "0x3ef4bd3948976bd4af03003e5bc0e109e016d563",
  "0xaaed3fcddeda26f9ad0582698d9be012e48d88af",
]);

/** True when the transfer is the platform fee payment (not the main recipient transfer). */
export function isPlatformFeeTransfer(transfer: { to: string }): boolean {
  return PLATFORM_FEE_TO_ADDRESSES_LOWER.has(transfer.to.toLowerCase());
}

const BASE_FEE_RECIPIENT_LOWER = "0x3ef4bd3948976bd4af03003e5bc0e109e016d563";

/** True if this owner should not appear as the row owner in transaction history (fee wallet). */
export function isPlatformFeeOwnerAddress(ownerAddress: string | null | undefined): boolean {
  if (!ownerAddress) return false;
  return ownerAddress.toLowerCase() === BASE_FEE_RECIPIENT_LOWER;
}

const KALP_BASE =
  (import.meta.env.VITE_KALP_WALLET_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://alpha-wallet-api.kalp.studio";

/**
 * Builds the token-transfers request URL (same query shape as the Kalp curl examples).
 */
export function buildKalpTokenTransfersUrl(opts: {
  address: string;
  chainId: string;
  page: number;
  contractAddress?: string;
  direction?: "from" | "to";
}): string {
  const params = new URLSearchParams({
    address: opts.address.trim(),
    chainId: String(opts.chainId),
    page: String(opts.page),
  });
  const contract = opts.contractAddress?.trim();
  if (contract) {
    params.set("contractAddress", contract);
  }
  if (opts.direction) {
    params.set("direction", opts.direction);
  }
  return `${KALP_BASE}/transactions/token-transfers?${params.toString()}`;
}

/** Default cap for explorer-style fetches (avoids scanning 4000+ sparse pages). */
export const DEFAULT_OPTIMIZED_MAX_PAGES = 50;

/** Stop after this many consecutive pages with empty `transfers` (sparse API data). */
const DEFAULT_CONSECUTIVE_EMPTY_LIMIT = 10;

/** Ignore transfers below this amount (noise / sub-cent legs). */
export const DEFAULT_DUST_THRESHOLD = 0.0000001;

/** Simple in-memory cache */
const transferCache = new Map<string, { data: NormalizedTransfer[]; ts: number }>();
const CACHE_TTL_MS = 60_000;

/** Clear transfer cache (e.g. when user wants fresh data on Activity page) */
export function clearTransferCache(): void {
  transferCache.clear();
}

function networkToChainId(network: AlchemyNetwork): string {
  return NETWORK_TO_CHAIN_ID[network];
}

function resolveOptimizedMaxPages(override?: number): number {
  const env = Number(import.meta.env.VITE_KALP_OPTIMIZED_MAX_PAGES);
  const fromEnv = Number.isFinite(env) && env > 0 ? Math.floor(env) : DEFAULT_OPTIMIZED_MAX_PAGES;
  const cap = override ?? fromEnv;
  return Math.min(Math.max(1, Math.floor(cap)), 100);
}

/** Dedupe key: one logical transfer per tx hash + recipient (matches multi-log txs). */
export function transferDedupeKey(hash: string, toAddress: string | undefined | null): string {
  return `${hash.toLowerCase()}:${String(toAddress ?? "").toLowerCase()}`;
}

function transferSortTime(t: NormalizedTransfer): number {
  if (t.blockTimestamp) {
    const ms = Date.parse(t.blockTimestamp);
    if (!Number.isNaN(ms)) return ms;
  }
  if (t.blockNum) {
    const n = t.blockNum.startsWith("0x") ? parseInt(t.blockNum, 16) : parseInt(t.blockNum, 10);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

interface KalpApiEnvelope {
  status?: number;
  message?: string;
  result?: {
    transfers?: unknown[];
    page?: string | number;
    totalPages?: string | number;
    hasMore?: boolean;
  };
}

async function fetchTokenTransfersPage(
  address: string,
  chainId: string,
  page: number,
  contractAddress: string | undefined,
  direction: "from" | "to" | undefined
): Promise<{ transfers: unknown[]; totalPages: number }> {
  const url = buildKalpTokenTransfersUrl({
    address,
    chainId,
    page,
    contractAddress: contractAddress?.trim() || undefined,
    direction,
  });
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Kalp API HTTP ${res.status}`);
  }
  const json = (await res.json()) as KalpApiEnvelope;
  if (json.status !== undefined && json.status !== 200) {
    throw new Error(json.message || `Kalp API status ${json.status}`);
  }
  const result = json.result;
  if (!result) {
    return { transfers: [], totalPages: 1 };
  }
  const transfers = Array.isArray(result.transfers) ? result.transfers : [];
  const totalPages = Math.max(1, Number(result.totalPages) || 1);
  return { transfers, totalPages };
}

function pickString(r: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = r[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function rawContractDecimals(rc: Record<string, unknown> | undefined): number | string | undefined {
  if (!rc) return undefined;
  const d = rc.decimals ?? rc.decimal ?? rc.tokenDecimals;
  return d as number | string | undefined;
}

function parseAmountFromKalp(r: Record<string, unknown>): number {
  const rc = r.rawContract as Record<string, unknown> | undefined;

  if (typeof r.amount === "number" && Number.isFinite(r.amount)) return r.amount;
  if (typeof r.amount === "string") {
    const a = parseFloat(r.amount);
    if (Number.isFinite(a)) return a;
  }

  /** Kalp returns human-readable `value` (e.g. 0.000901) alongside rawContract hex */
  if (typeof r.value === "number" && Number.isFinite(r.value)) {
    if (rc?.rawValue != null) {
      return parseRawAmount(
        rc.rawValue,
        rawContractDecimals(rc) ?? (r.decimals as string | number | undefined)
      );
    }
    return r.value;
  }

  if (typeof r.value === "string" && !/^[0-9]+$/.test(r.value)) {
    const n = parseFloat(r.value);
    if (Number.isFinite(n)) return n;
  }

  if (r.valueFormatted != null) {
    const n = parseFloat(String(r.valueFormatted));
    if (Number.isFinite(n)) return n;
  }

  const raw =
    rc?.rawValue ?? rc?.value ?? r.value ?? r.amount;
  const decimals = Number(
    r.decimals ?? r.tokenDecimals ?? rawContractDecimals(rc) ?? 6
  );
  if (raw != null && String(raw).trim() !== "") {
    return parseRawAmount(raw, decimals);
  }
  return 0;
}

function parseRawAmount(raw: unknown, decimals: number | string | undefined): number {
  let d = 6;
  if (typeof decimals === "number" && Number.isFinite(decimals)) {
    d = decimals;
  } else if (typeof decimals === "string") {
    const parsed = decimals.startsWith("0x")
      ? parseInt(decimals, 16)
      : parseInt(decimals, 10);
    if (Number.isFinite(parsed)) d = parsed;
  }
  const dec = d;
  try {
    if (typeof raw === "string") {
      const s = raw.trim();
      if (/^0x[0-9a-fA-F]+$/.test(s)) {
        return Number(BigInt(s)) / 10 ** dec;
      }
      if (/^[0-9]+$/.test(s)) {
        return Number(BigInt(s)) / 10 ** dec;
      }
    }
    if (typeof raw === "number") {
      return raw / 10 ** dec;
    }
  } catch {
    /* ignore */
  }
  return 0;
}

function normalizeKalpTransfer(raw: unknown): NormalizedTransfer {
  if (!raw || typeof raw !== "object") {
    return { from: "", to: "", amount: 0, hash: "" };
  }
  const r = raw as Record<string, unknown>;
  const from = pickString(r, ["from", "fromAddress", "sender", "from_address"]);
  const to = pickString(r, ["to", "toAddress", "recipient", "to_address"]);
  const hash = pickString(r, ["transactionHash", "txHash", "hash", "txnHash", "transaction_hash"]);
  const amount = parseAmountFromKalp(r);

  let blockNum: string | undefined;
  const bn = r.blockNumber ?? r.blockNum;
  if (bn != null) {
    blockNum = typeof bn === "string" ? bn : String(bn);
  }

  let blockTimestamp: string | undefined;
  const metadata = r.metadata as Record<string, unknown> | undefined;
  const ts =
    metadata?.blockTimestamp ??
    r.blockTimestamp ??
    r.timestamp ??
    r.timeStamp ??
    r.block_timestamp;
  if (typeof ts === "string" && ts.trim()) {
    blockTimestamp = ts.trim();
  }

  return {
    from,
    to,
    amount,
    hash,
    blockNum,
    blockTimestamp,
  };
}

export interface GetOptimizedTransactionsOptions {
  /** Max pages to request (default: env `VITE_KALP_OPTIMIZED_MAX_PAGES` or 15). */
  maxPages?: number;
  /** Stop after this many consecutive pages with empty `transfers` (default 2). */
  consecutiveEmptyStreak?: number;
  /** Drop transfers below this amount (default 0.00001). */
  dustThreshold?: number;
  /** Kalp `direction`; omit or `undefined` for both sent and received in one stream. */
  direction?: "from" | "to";
}

/**
 * Fetches ERC-20 transfers for a wallet with bounded cost: caps page count, stops early
 * when the API returns sparse empty pages, dedupes by `hash` + `to`, drops platform fees
 * and dust, and returns rows sorted newest-first.
 *
 * Why this is efficient: we never walk thousands of pages; empty pages are common in
 * this API and consecutive-empty stop avoids useless work; dedupe + filter shrink memory
 * and downstream UI work; a single directionless stream (when `direction` omitted)
 * avoids duplicate network calls when you need both sides.
 */
export async function getOptimizedTransactions(
  address: string,
  tokenAddress: string,
  network: AlchemyNetwork = "base-sepolia",
  options: GetOptimizedTransactionsOptions = {}
): Promise<NormalizedTransfer[]> {
  const trimmed = address?.trim();
  if (!trimmed) {
    return [];
  }

  const maxPages = resolveOptimizedMaxPages(options.maxPages);
  const emptyStreakLimit =
    options.consecutiveEmptyStreak !== undefined
      ? Math.max(1, Math.floor(options.consecutiveEmptyStreak))
      : DEFAULT_CONSECUTIVE_EMPTY_LIMIT;
  const dustThreshold =
    options.dustThreshold !== undefined ? options.dustThreshold : DEFAULT_DUST_THRESHOLD;

  const chainId = networkToChainId(network);
  const contract = tokenAddress?.trim() || undefined;
  const direction = options.direction;

  const seen = new Map<string, NormalizedTransfer>();
  let consecutiveEmpty = 0;

  for (let page = 1; page <= maxPages; page++) {
    let transfers: unknown[];
    try {
      const res = await fetchTokenTransfersPage(trimmed, chainId, page, contract, direction);
      transfers = res.transfers;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Kalp] getOptimizedTransactions page", page, "failed:", msg);
      throw err instanceof Error ? err : new Error(msg);
    }

    if (transfers.length === 0) {
      consecutiveEmpty++;
      if (consecutiveEmpty >= emptyStreakLimit) {
        break;
      }
      continue;
    }

    consecutiveEmpty = 0;

    for (const raw of transfers) {
      const t = normalizeKalpTransfer(raw);
      if (!t.hash) continue;
      if (isPlatformFeeTransfer(t)) continue;
      if (t.amount < dustThreshold) continue;

      const key = transferDedupeKey(t.hash, t.to);
      if (seen.has(key)) continue;
      seen.set(key, t);
    }
  }

  const list = Array.from(seen.values());
  list.sort((a, b) => transferSortTime(b) - transferSortTime(a));
  return list;
}

/**
 * Fetch all ERC20 transfers SENT from an address for a specific token.
 */
export async function getSentTransactions(
  address: string,
  tokenAddress: string,
  network: AlchemyNetwork = "base-sepolia"
): Promise<NormalizedTransfer[]> {
  const cacheKey = `sent:${network}:${address.toLowerCase()}:${tokenAddress.toLowerCase()}`;
  const cached = transferCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    if (import.meta.env.DEV) console.log("[Kalp] Cache hit (sent):", cacheKey);
    return cached.data;
  }

  try {
    const transfers = await getOptimizedTransactions(address, tokenAddress, network, {
      direction: "from",
    });
    transferCache.set(cacheKey, { data: transfers, ts: Date.now() });
    if (import.meta.env.DEV) {
      console.log("[Kalp] getSentTransactions:", address, "count:", transfers.length);
    }
    return transfers;
  } catch (err) {
    console.error("[Kalp] getSentTransactions error:", err);
    throw err;
  }
}

/**
 * Fetch all ERC20 transfers RECEIVED by an address for a specific token.
 */
export async function getReceivedTransactions(
  address: string,
  tokenAddress: string,
  network: AlchemyNetwork = "base-sepolia"
): Promise<NormalizedTransfer[]> {
  const cacheKey = `received:${network}:${address.toLowerCase()}:${tokenAddress.toLowerCase()}`;
  const cached = transferCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    if (import.meta.env.DEV) console.log("[Kalp] Cache hit (received):", cacheKey);
    return cached.data;
  }

  try {
    const transfers = await getOptimizedTransactions(address, tokenAddress, network, {
      direction: "to",
    });
    transferCache.set(cacheKey, { data: transfers, ts: Date.now() });
    if (import.meta.env.DEV) {
      console.log("[Kalp] getReceivedTransactions:", address, "count:", transfers.length);
    }
    return transfers;
  } catch (err) {
    console.error("[Kalp] getReceivedTransactions error:", err);
    throw err;
  }
}

/**
 * Fetch ERC20 transfers (sent + received) for an address and token.
 * Uses the Kalp "both directions" query (omit `direction`) and optimized pagination.
 */
export async function getAllTransactions(
  address: string,
  tokenAddress: string,
  network: AlchemyNetwork = "base-sepolia"
): Promise<NormalizedTransfer[]> {
  const cacheKey = `all:${network}:${address.toLowerCase()}:${tokenAddress.toLowerCase()}`;
  const cached = transferCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    if (import.meta.env.DEV) console.log("[Kalp] Cache hit (all):", cacheKey);
    return cached.data;
  }

  try {
    const merged = await getOptimizedTransactions(address, tokenAddress, network);
    transferCache.set(cacheKey, { data: merged, ts: Date.now() });
    if (import.meta.env.DEV) {
      console.log("[Kalp] getAllTransactions:", address, "total transfers:", merged.length);
    }
    return merged;
  } catch (err) {
    console.error("[Kalp] getAllTransactions error:", err);
    throw err;
  }
}

/**
 * Calculate sent and received totals from normalized transfers for a given address.
 */
export function calculateTotals(
  transactions: NormalizedTransfer[],
  address: string
): TransferTotals {
  const addr = address.toLowerCase();
  let sent = 0;
  let received = 0;

  for (const tx of transactions) {
    if (isPlatformFeeTransfer(tx)) continue;

    const fromMatch = tx.from.toLowerCase() === addr;
    const toMatch = tx.to.toLowerCase() === addr;

    if (fromMatch && !toMatch) {
      sent += tx.amount;
    } else if (!fromMatch && toMatch) {
      received += tx.amount;
    }
  }

  if (import.meta.env.DEV && transactions.length > 0) {
    console.log("[Kalp] calculateTotals for", address, "-> sent:", sent, "received:", received);
  }
  return { sent, received };
}
