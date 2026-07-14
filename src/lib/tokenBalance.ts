import { getChainConfig, resolveTokenAddress, CHAIN_REGISTRY } from "@/lib/chains";
import { parseBalanceNumber } from "@/lib/formatBalance";
import { apiPost, getKalpWalletApiKey, getWalletApiBase, type ChainEntry } from "@/lib/walletApi";

/**
 * Fetch ERC-20 balance via `POST /v2/wallet/balance` using the currently active chain.
 */
export async function fetchTokenBalance(walletAddress: string): Promise<number> {
  const config = getChainConfig();
  const tokenAddress = resolveTokenAddress();
  const chainId = parseInt(config.chainId, 10);
  if (!Number.isFinite(chainId)) {
    throw new Error(`Invalid chain ID: ${config.chainId}`);
  }

  const data = await apiPost<unknown>(
    "v2/wallet/balance",
    {
      address: walletAddress.trim(),
      chainId,
      currency: config.currency,
      smartContractAddress: tokenAddress,
    },
    { apiKey: getKalpWalletApiKey(), baseUrl: getWalletApiBase() },
  );

  return parseBalanceNumber(data);
}

/**
 * Fetch token balance for an explicit chain (from chainsAndNetworks API response).
 * Uses CHAIN_REGISTRY tokenAddress when available, falls back to nativeToken from localStorage.
 */
export async function fetchTokenBalanceForChain(
  walletAddress: string,
  chain: ChainEntry,
): Promise<number> {
  const chainId = parseInt(chain.chainId, 10);
  if (!Number.isFinite(chainId)) throw new Error(`Invalid chain ID: ${chain.chainId}`);

  // Prefer CHAIN_REGISTRY token address (our known ERC-20), fall back to a zero address
  const registryEntry = CHAIN_REGISTRY[chain.chainId];
  const tokenAddress = registryEntry?.tokenAddress ?? "";

  const data = await apiPost<unknown>(
    "v2/wallet/balance",
    {
      address: walletAddress.trim(),
      chainId,
      currency: chain.currency,
      smartContractAddress: tokenAddress,
    },
    { apiKey: getKalpWalletApiKey(), baseUrl: getWalletApiBase() },
  );

  return parseBalanceNumber(data);
}
