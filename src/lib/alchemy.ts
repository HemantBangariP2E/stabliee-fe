import { Alchemy, Network, AssetTransfersCategory } from "alchemy-sdk";
import type { AssetTransfersResult } from "alchemy-sdk";

/** Supported networks for ERC20 transaction fetching */
export type AlchemyNetwork = "eth-sepolia" | "base-sepolia";

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
  /** Token contract this transfer belongs to */
  tokenAddress?: string;
}

/** Totals from calculateTotals */
export interface TransferTotals {
  sent: number;
  received: number;
}

const API_KEY =
  import.meta.env.VITE_ALCHEMY_KEY || "e_gedLLWmPahJs32v18G-";

const networkMap: Record<AlchemyNetwork, Network> = {
  "eth-sepolia": Network.ETH_SEPOLIA,
  "base-sepolia": Network.BASE_SEPOLIA,
};

/** Cache for Alchemy instances per network */
const alchemyInstances: Partial<Record<AlchemyNetwork, Alchemy>> = {};

/** Simple in-memory cache for debugging (optional) */
const transferCache = new Map<string, { data: NormalizedTransfer[]; ts: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

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

function normalizeTransfer(
  t: AssetTransfersResult & { metadata?: { blockTimestamp?: string } },
  tokenAddress: string
): NormalizedTransfer {
  return {
    from: t.from,
    to: t.to ?? "",
    amount: t.value ?? 0,
    hash: t.hash,
    blockNum: t.blockNum,
    blockTimestamp: t.metadata?.blockTimestamp,
    tokenAddress,
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
    });

    const normalized = response.transfers.map((t) => normalizeTransfer(t, tokenAddress));
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
 * Fetch all ERC20 transfers (sent + received) for multiple token contracts.
 * Deduplicates by transaction hash.
 */
export async function getAllTransactionsForTokens(
  address: string,
  tokenAddresses: string[],
  network: AlchemyNetwork = "base-sepolia"
): Promise<NormalizedTransfer[]> {
  const unique = [
    ...new Set(
      tokenAddresses
        .map((addr) => addr?.trim().toLowerCase())
        .filter((addr): addr is string => Boolean(addr))
    ),
  ];

  if (unique.length === 0) return [];
  if (unique.length === 1) {
    return getAllTransactions(address, unique[0], network);
  }

  try {
    const results = await Promise.all(
      unique.map((tokenAddress) => getAllTransactions(address, tokenAddress, network))
    );

    const byHash = new Map<string, NormalizedTransfer>();
    for (const transfers of results) {
      for (const tx of transfers) {
        const key = tx.hash.toLowerCase();
        if (!byHash.has(key)) {
          byHash.set(key, tx);
        }
      }
    }

    return [...byHash.values()];
  } catch (err) {
    console.error("[Alchemy] getAllTransactionsForTokens error:", err);
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
