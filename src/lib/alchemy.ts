import { Alchemy, Network, AssetTransfersCategory, SortingOrder } from "alchemy-sdk";
import type { AssetTransfersResult } from "alchemy-sdk";

/** Supported networks for ERC20 transaction fetching */
export type AlchemyNetwork =
  | "eth-sepolia"
  | "base-sepolia"
  | "eth-mainnet"
  | "base-mainnet";

/** Normalized ERC20 transfer format */
export interface NormalizedTransfer {
  from: string;
  to: string;
  amount: number;
  hash: string;
  /** Block number (hex string). Present when fetched with metadata. */
  blockNum?: string;
  /** ISO timestamp. Present when fetched with metadata. */
  blockTimestamp?: string;
}

/** Totals from calculateTotals */
export interface TransferTotals {
  sent: number;
  received: number;
}

/** MPC/platform fee legs (same tx hash as user send); exclude from UI and totals */
const PLATFORM_FEE_TO_ADDRESSES_LOWER = new Set([
  "0x3ef4bd3948976bd4af03003e5bc0e109e016d563", // Base family fee recipient
  "0xaaed3fcddeda26f9ad0582698d9be012e48d88af", // Ethereum family fee recipient
]);

/** True when the transfer is the platform fee payment (not the main recipient transfer). */
export function isPlatformFeeTransfer(transfer: { to: string }): boolean {
  return PLATFORM_FEE_TO_ADDRESSES_LOWER.has(transfer.to.toLowerCase());
}

/** Base fee recipient — hide Supabase rows where this address is stored as owner_address. */
const BASE_FEE_RECIPIENT_LOWER = "0x3ef4bd3948976bd4af03003e5bc0e109e016d563";

/** True if this owner should not appear as the row owner in transaction history (fee wallet). */
export function isPlatformFeeOwnerAddress(ownerAddress: string | null | undefined): boolean {
  if (!ownerAddress) return false;
  return ownerAddress.toLowerCase() === BASE_FEE_RECIPIENT_LOWER;
}

const API_KEY =
  import.meta.env.VITE_ALCHEMY_KEY || "e_gedLLWmPahJs32v18G-";

const networkMap: Record<AlchemyNetwork, Network> = {
  "eth-sepolia": Network.ETH_SEPOLIA,
  "base-sepolia": Network.BASE_SEPOLIA,
  "eth-mainnet": Network.ETH_MAINNET,
  "base-mainnet": Network.BASE_MAINNET,
};

/** Cache for Alchemy instances per network */
const alchemyInstances: Partial<Record<AlchemyNetwork, Alchemy>> = {};

/** Simple in-memory cache for debugging (optional) */
const transferCache = new Map<string, { data: NormalizedTransfer[]; ts: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

/** Clear transfer cache (e.g. when user wants fresh data on Activity page) */
export function clearTransferCache(): void {
  transferCache.clear();
}

function getAlchemy(network: AlchemyNetwork): Alchemy {
  if (!alchemyInstances[network]) {
    alchemyInstances[network] = new Alchemy({
      apiKey: API_KEY,
      network: networkMap[network],
    });
    if (import.meta.env.DEV) {
      console.log("[Alchemy] Created instance for network:", network);
    }
  }
  return alchemyInstances[network]!;
}

function parseAmount(
  t: AssetTransfersResult & { metadata?: { blockTimestamp?: string } }
): number {
  const val = t.value;
  const numVal = typeof val === "string" ? parseFloat(val) : val;
  if (numVal != null && Number.isFinite(numVal)) return numVal;
  const raw = (t as { rawContract?: { rawValue?: string; decimals?: string | number } }).rawContract;
  if (raw?.rawValue != null) {
    let decimals = 6;
    if (raw.decimals != null) {
      const d = raw.decimals;
      decimals = typeof d === "number" ? d : parseInt(String(d), String(d).startsWith("0x") ? 16 : 10) || 6;
    }
    const rawNum = Number(BigInt(raw.rawValue));
    return rawNum / Math.pow(10, decimals);
  }
  return 0;
}

function normalizeTransfer(
  t: AssetTransfersResult & { metadata?: { blockTimestamp?: string } }
): NormalizedTransfer {
  return {
    from: t.from,
    to: t.to ?? "",
    amount: parseAmount(t),
    hash: t.hash,
    blockNum: t.blockNum,
    blockTimestamp: t.metadata?.blockTimestamp,
  };
}

async function fetchAllPages(
  network: AlchemyNetwork,
  tokenAddress: string,
  params: { fromAddress?: string; toAddress?: string }
): Promise<NormalizedTransfer[]> {
  const alchemy = getAlchemy(network);
  const all: NormalizedTransfer[] = [];
  let pageKey: string | undefined;

  do {
    const response = await alchemy.core.getAssetTransfers({
      category: [AssetTransfersCategory.ERC20],
      contractAddresses: [tokenAddress],
      fromAddress: params.fromAddress,
      toAddress: params.toAddress,
      excludeZeroValue: true,
      maxCount: 1000,
      pageKey,
      withMetadata: true,
      fromBlock: "0x0",
      toBlock: "latest",
      order: SortingOrder.DESCENDING,
    });

    const normalized = response.transfers.map(normalizeTransfer);
    all.push(...normalized);
    pageKey = response.pageKey;

    if (import.meta.env.DEV && response.transfers.length > 0) {
      console.log(
        "[Alchemy] Fetched page:",
        response.transfers.length,
        "transfers, hasMore:",
        !!pageKey
      );
    }
  } while (pageKey);

  return all;
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
    if (import.meta.env.DEV) console.log("[Alchemy] Cache hit (sent):", cacheKey);
    return cached.data;
  }

  try {
    const transfers = await fetchAllPages(network, tokenAddress, {
      fromAddress: address,
    });
    transferCache.set(cacheKey, { data: transfers, ts: Date.now() });
    if (import.meta.env.DEV) {
      console.log("[Alchemy] getSentTransactions:", address, "count:", transfers.length);
    }
    return transfers;
  } catch (err) {
    console.error("[Alchemy] getSentTransactions error:", err);
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
    if (import.meta.env.DEV) console.log("[Alchemy] Cache hit (received):", cacheKey);
    return cached.data;
  }

  try {
    const transfers = await fetchAllPages(network, tokenAddress, {
      toAddress: address,
    });
    transferCache.set(cacheKey, { data: transfers, ts: Date.now() });
    if (import.meta.env.DEV) {
      console.log("[Alchemy] getReceivedTransactions:", address, "count:", transfers.length);
    }
    return transfers;
  } catch (err) {
    console.error("[Alchemy] getReceivedTransactions error:", err);
    throw err;
  }
}

/**
 * Fetch all ERC20 transfers (sent + received) for an address and token.
 * Batches both calls in parallel for performance.
 */
export async function getAllTransactions(
  address: string,
  tokenAddress: string,
  network: AlchemyNetwork = "base-sepolia"
): Promise<NormalizedTransfer[]> {
  const cacheKey = `all:${network}:${address.toLowerCase()}:${tokenAddress.toLowerCase()}`;
  const cached = transferCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    if (import.meta.env.DEV) console.log("[Alchemy] Cache hit (all):", cacheKey);
    return cached.data;
  }

  try {
    const [sent, received] = await Promise.all([
      getSentTransactions(address, tokenAddress, network),
      getReceivedTransactions(address, tokenAddress, network),
    ]);

    const combined = [...sent, ...received];
    transferCache.set(cacheKey, { data: combined, ts: Date.now() });
    if (import.meta.env.DEV) {
      console.log("[Alchemy] getAllTransactions:", address, "sent:", sent.length, "received:", received.length);
    }
    return combined;
  } catch (err) {
    console.error("[Alchemy] getAllTransactions error:", err);
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
    console.log("[Alchemy] calculateTotals for", address, "-> sent:", sent, "received:", received);
  }
  return { sent, received };
}
