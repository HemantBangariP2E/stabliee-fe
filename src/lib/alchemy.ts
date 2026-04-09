/**
 * ERC-20 transfer history via Kalp Wallet API
 * `GET .../transactions/token-transfers`
 *
 * Query params: address, chainId, direction?, contractAddress?, limit?, pageKey?
 * Pagination: prefer `pageKey` (cursor); fall back to `page` when API omits cursors.
 */

export type AlchemyNetwork =
  | "eth-sepolia"
  | "base-sepolia"
  | "eth-mainnet"
  | "base-mainnet"
  | "polygon-mainnet"
  | "polygon-amoy";

const NETWORK_TO_CHAIN_ID: Record<AlchemyNetwork, string> = {
  "eth-sepolia": "11155111",
  "base-sepolia": "84532",
  "eth-mainnet": "1",
  "base-mainnet": "8453",
  "polygon-mainnet": "137",
  "polygon-amoy": "80002",
};

export interface NormalizedTransfer {
  from: string;
  to: string;
  amount: number;
  hash: string;
  blockNum?: string;
  blockTimestamp?: string;
}

export interface TransferTotals {
  sent: number;
  received: number;
}

const PLATFORM_FEE_TO_ADDRESSES_LOWER = new Set([
  "0x3ef4bd3948976bd4af03003e5bc0e109e016d563",
  "0xaaed3fcddeda26f9ad0582698d9be012e48d88af",
]);

export function isPlatformFeeTransfer(transfer: { to: string }): boolean {
  return PLATFORM_FEE_TO_ADDRESSES_LOWER.has(transfer.to.toLowerCase());
}

const BASE_FEE_RECIPIENT_LOWER = "0x3ef4bd3948976bd4af03003e5bc0e109e016d563";

export function isPlatformFeeOwnerAddress(ownerAddress: string | null | undefined): boolean {
  if (!ownerAddress) return false;
  return ownerAddress.toLowerCase() === BASE_FEE_RECIPIENT_LOWER;
}

const KALP_BASE =
  (import.meta.env.VITE_KALP_WALLET_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://alpha-wallet-api.kalp.studio";

/** Results per request (API default 50, max 1000). */
const DEFAULT_LIMIT = Math.min(
  Math.max(
    10,
    Number(import.meta.env.VITE_KALP_TRANSFER_LIMIT) || 50
  ),
  1000
);

/** Max cursor/page batches per fetch (caps work when totalPages is huge). */
const MAX_FETCH_BATCHES = Number(import.meta.env.VITE_KALP_MAX_BATCHES) || 40;

const transferCache = new Map<string, { data: NormalizedTransfer[]; ts: number }>();
const CACHE_TTL_MS = 60_000;

export function clearTransferCache(): void {
  transferCache.clear();
}

function networkToChainId(network: AlchemyNetwork): string {
  return NETWORK_TO_CHAIN_ID[network];
}

export function buildKalpTokenTransfersUrl(params: {
  address: string;
  chainId: string;
  limit: number;
  contractAddress?: string;
  direction?: "from" | "to";
  pageKey?: string;
  page?: number;
}): string {
  const q = new URLSearchParams({
    address: params.address.trim(),
    chainId: String(params.chainId),
    limit: String(Math.min(1000, Math.max(1, params.limit))),
  });
  const c = params.contractAddress?.trim();
  if (c) q.set("contractAddress", c);
  if (params.direction) q.set("direction", params.direction);
  if (params.pageKey) q.set("pageKey", params.pageKey);
  else if (params.page != null && params.page >= 1) q.set("page", String(params.page));
  return `${KALP_BASE}/transactions/token-transfers?${q.toString()}`;
}

interface KalpApiEnvelope {
  status?: number;
  message?: string;
  result?: {
    transfers?: unknown[];
    page?: string | number;
    totalPages?: string | number;
    hasMore?: boolean;
    pageKey?: string | null;
    nextPageKey?: string | null;
  };
}

async function fetchKalpTransfersOnce(opts: {
  address: string;
  chainId: string;
  limit: number;
  contractAddress?: string;
  direction?: "from" | "to";
  pageKey?: string;
  page?: number;
}): Promise<{
  transfers: unknown[];
  nextPageKey: string | null;
  nextPage: number | null;
  hasMore: boolean;
}> {
  const url = buildKalpTokenTransfersUrl({
    address: opts.address,
    chainId: opts.chainId,
    limit: opts.limit,
    contractAddress: opts.contractAddress,
    direction: opts.direction,
    pageKey: opts.pageKey,
    page: opts.pageKey ? undefined : opts.page,
  });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Kalp API HTTP ${res.status}`);
  const json = (await res.json()) as KalpApiEnvelope;
  if (json.status !== undefined && json.status !== 200) {
    throw new Error(json.message || `Kalp API status ${json.status}`);
  }
  const result = json.result;
  if (!result) {
    return { transfers: [], nextPageKey: null, nextPage: null, hasMore: false };
  }

  const transfers = Array.isArray(result.transfers) ? result.transfers : [];
  const cursor =
    (typeof result.pageKey === "string" && result.pageKey) ||
    (typeof result.nextPageKey === "string" && result.nextPageKey) ||
    null;

  const pageNum = Math.max(1, Number(result.page) || 1);
  const totalPages = Math.max(1, Number(result.totalPages) || 1);
  const hasMore = Boolean(result.hasMore);
  const nextPage = pageNum < totalPages && hasMore ? pageNum + 1 : null;

  return {
    transfers,
    nextPageKey: cursor,
    nextPage,
    hasMore,
  };
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
  return (rc.decimals ?? rc.decimal ?? rc.tokenDecimals) as number | string | undefined;
}

function parseRawAmount(raw: unknown, decimals: number | string | undefined): number {
  let d = 6;
  if (typeof decimals === "number" && Number.isFinite(decimals)) d = decimals;
  else if (typeof decimals === "string") {
    const parsed = decimals.startsWith("0x") ? parseInt(decimals, 16) : parseInt(decimals, 10);
    if (Number.isFinite(parsed)) d = parsed;
  }
  try {
    if (typeof raw === "string") {
      const s = raw.trim();
      if (/^0x[0-9a-fA-F]+$/.test(s)) return Number(BigInt(s)) / 10 ** d;
      if (/^[0-9]+$/.test(s)) return Number(BigInt(s)) / 10 ** d;
    }
    if (typeof raw === "number") return raw / 10 ** d;
  } catch {
    /* ignore */
  }
  return 0;
}

function parseAmountFromKalp(r: Record<string, unknown>): number {
  const rc = r.rawContract as Record<string, unknown> | undefined;

  if (typeof r.amount === "number" && Number.isFinite(r.amount)) return r.amount;
  if (typeof r.amount === "string") {
    const a = parseFloat(r.amount);
    if (Number.isFinite(a)) return a;
  }

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

  const raw = rc?.rawValue ?? rc?.value ?? r.value ?? r.amount;
  const decimals = Number(r.decimals ?? r.tokenDecimals ?? rawContractDecimals(rc) ?? 6);
  if (raw != null && String(raw).trim() !== "") return parseRawAmount(raw, decimals);
  return 0;
}

export function normalizeKalpTransfer(raw: unknown): NormalizedTransfer {
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
  if (bn != null) blockNum = typeof bn === "string" ? bn : String(bn);

  const metadata = r.metadata as Record<string, unknown> | undefined;
  const ts =
    metadata?.blockTimestamp ??
    r.blockTimestamp ??
    r.timestamp ??
    r.timeStamp ??
    r.block_timestamp;
  const blockTimestamp = typeof ts === "string" && ts.trim() ? ts.trim() : undefined;

  return { from, to, amount, hash, blockNum, blockTimestamp };
}

/**
 * Paginate token-transfers using `pageKey` when provided, else numeric `page`.
 * Stops after empty streak or max batches.
 */
async function fetchTransfersBatched(opts: {
  address: string;
  chainId: string;
  contractAddress?: string;
  direction?: "from" | "to";
  limit?: number;
}): Promise<NormalizedTransfer[]> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const out: NormalizedTransfer[] = [];
  let pageKey: string | undefined;
  let page = 1;
  let consecutiveEmpty = 0;
  const emptyStreakLimit = 3;

  for (let batch = 0; batch < MAX_FETCH_BATCHES; batch++) {
    const { transfers, nextPageKey, nextPage, hasMore } = await fetchKalpTransfersOnce({
      address: opts.address,
      chainId: opts.chainId,
      limit,
      contractAddress: opts.contractAddress,
      direction: opts.direction,
      pageKey,
      page: pageKey ? undefined : page,
    });

    if (transfers.length === 0) {
      consecutiveEmpty++;
      if (consecutiveEmpty >= emptyStreakLimit) break;
    } else {
      consecutiveEmpty = 0;
      for (const raw of transfers) {
        out.push(normalizeKalpTransfer(raw));
      }
    }

    if (nextPageKey) {
      pageKey = nextPageKey;
      continue;
    }

    if (!hasMore || nextPage == null) break;
    page = nextPage;
    pageKey = undefined;
  }

  return out;
}

export async function getSentTransactions(
  address: string,
  tokenAddress: string,
  network: AlchemyNetwork = "base-sepolia"
): Promise<NormalizedTransfer[]> {
  const chainId = networkToChainId(network);
  const cacheKey = `sent:${network}:${address.toLowerCase()}:${tokenAddress.toLowerCase()}`;
  const cached = transferCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const data = await fetchTransfersBatched({
    address,
    chainId,
    contractAddress: tokenAddress,
    direction: "from",
  });
  transferCache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

export async function getReceivedTransactions(
  address: string,
  tokenAddress: string,
  network: AlchemyNetwork = "base-sepolia"
): Promise<NormalizedTransfer[]> {
  const chainId = networkToChainId(network);
  const cacheKey = `received:${network}:${address.toLowerCase()}:${tokenAddress.toLowerCase()}`;
  const cached = transferCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const data = await fetchTransfersBatched({
    address,
    chainId,
    contractAddress: tokenAddress,
    direction: "to",
  });
  transferCache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

export async function getAllTransactions(
  address: string,
  tokenAddress: string,
  network: AlchemyNetwork = "base-sepolia"
): Promise<NormalizedTransfer[]> {
  const chainId = networkToChainId(network);
  const cacheKey = `all:${network}:${address.toLowerCase()}:${tokenAddress.toLowerCase()}`;
  const cached = transferCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const merged = await fetchTransfersBatched({
    address,
    chainId,
    contractAddress: tokenAddress,
    // omit direction → both sent and received (per Kalp docs)
  });

  transferCache.set(cacheKey, { data: merged, ts: Date.now() });
  return merged;
}

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
    if (fromMatch && !toMatch) sent += tx.amount;
    else if (!fromMatch && toMatch) received += tx.amount;
  }

  return { sent, received };
}
