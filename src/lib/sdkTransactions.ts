import type { Chain, TreSori } from "@kalp_studio/tresori-sdk-js";

type TreSoriInstance = ReturnType<typeof TreSori>;

/** Normalized row from SDK `getWalletTransactions` → `result.data[]`. */
export type SdkNormalizedTransfer = {
  id?: string;
  from: string;
  to: string;
  amount: number;
  hash: string;
  blockTimestamp?: string;
  blockchain?: string;
  network?: string;
  transactionType?: string;
  contractAddress?: string | null;
  blockchainUrl?: string;
  status?: string;
  errorMessage?: string | null;
};

export type SdkTransferTotals = {
  sent: number;
  received: number;
};

export type SdkTransactionsPage = {
  data: SdkNormalizedTransfer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function parseAmount(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Map SDK status values (e.g. COMPLETED) to UI labels. */
export function mapSdkTxStatus(status?: string): "Success" | "Failed" | "Pending" {
  const s = status?.toUpperCase() ?? "";
  if (s === "COMPLETED" || s === "SUCCESS") return "Success";
  if (s === "FAILED" || s === "ERROR") return "Failed";
  if (s === "PENDING" || s === "PROCESSING") return "Pending";
  return "Success";
}

function normalizeSdkTransfer(item: Record<string, unknown>): SdkNormalizedTransfer | null {
  const hash = String(item.transactionHash ?? item.txHash ?? item.hash ?? "").trim();
  const from = String(item.fromAddress ?? item.from ?? "").trim();
  const to = String(item.toAddress ?? item.to ?? "").trim();
  if (!hash || !from || !to) return null;

  const createdAt = item.createdAt ?? item.updatedAt ?? item.blockTimestamp;

  return {
    id: item.id != null ? String(item.id) : undefined,
    from,
    to,
    amount: parseAmount(item.amount),
    hash,
    blockTimestamp: createdAt ? String(createdAt) : undefined,
    blockchain: item.blockchain != null ? String(item.blockchain) : undefined,
    network: item.network != null ? String(item.network) : undefined,
    transactionType: item.transactionType != null ? String(item.transactionType) : undefined,
    contractAddress:
      item.contractAddress === null || item.contractAddress === undefined
        ? item.contractAddress ?? null
        : String(item.contractAddress),
    blockchainUrl: item.blockchainUrl != null ? String(item.blockchainUrl) : undefined,
    status: item.status != null ? String(item.status) : undefined,
    errorMessage: item.errorMessage != null ? String(item.errorMessage) : null,
  };
}

function parseSdkPage(response: unknown): SdkTransactionsPage {
  const root = asRecord(response);
  const result = asRecord(root?.result) ?? root ?? {};
  const list = result.data;
  const rows = Array.isArray(list)
    ? list
        .filter((item) => item && typeof item === "object")
        .map((item) => normalizeSdkTransfer(item as Record<string, unknown>))
        .filter((tx): tx is SdkNormalizedTransfer => tx !== null)
    : [];

  return {
    data: rows,
    total: parseAmount(result.total),
    page: parseAmount(result.page) || 1,
    limit: parseAmount(result.limit) || rows.length,
    totalPages: parseAmount(result.totalPages) || 1,
  };
}

function matchesChain(transfer: SdkNormalizedTransfer, chain: Chain): boolean {
  if (transfer.blockchain && transfer.network) {
    return (
      transfer.blockchain.toUpperCase() === chain.blockchain.toUpperCase() &&
      transfer.network.toUpperCase() === chain.network.toUpperCase()
    );
  }
  return true;
}

/** Fetch wallet transactions via `tresori.getWalletTransactions` (SDK only). */
export async function fetchWalletTransactions(
  tresori: TreSoriInstance,
  args: {
    chain: Chain;
    walletAddress: string;
    limit?: number;
    maxPages?: number;
  },
): Promise<SdkNormalizedTransfer[]> {
  const { chain, walletAddress, limit = 100, maxPages = 50 } = args;
  const address = walletAddress.trim();
  if (!address) return [];

  const collected: SdkNormalizedTransfer[] = [];
  const seen = new Set<string>();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= maxPages) {
    const response = await tresori.getWalletTransactions({
      walletAddress: address,
      page,
      limit,
    });

    const parsed = parseSdkPage(response);
    totalPages = parsed.totalPages;

    for (const tx of parsed.data) {
      if (!matchesChain(tx, chain)) continue;
      const key = tx.hash.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push(tx);
    }

    if (parsed.data.length === 0 || page >= totalPages) break;
    page += 1;
  }

  return collected;
}

export function calculateSdkTotals(
  transactions: SdkNormalizedTransfer[],
  walletAddress: string,
): SdkTransferTotals {
  const addr = walletAddress.toLowerCase();
  let sent = 0;
  let received = 0;

  for (const tx of transactions) {
    const fromMatch = tx.from.toLowerCase() === addr;
    const toMatch = tx.to.toLowerCase() === addr;
    if (fromMatch && !toMatch) sent += tx.amount;
    else if (!fromMatch && toMatch) received += tx.amount;
  }

  return { sent, received };
}
