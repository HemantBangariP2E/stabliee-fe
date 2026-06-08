import { getChainConfig } from "@/lib/chains";
import { parseBalanceNumber } from "@/lib/formatBalance";
import { apiPost, getKalpWalletApiKey, getWalletApiBase } from "@/lib/walletApi";

/**
 * Fetch ERC-20 balance via `POST /v2/wallet/balance` (same as custodial-daaps).
 * Avoids public RPC rate limits on Polygon Amoy and other testnets.
 */
export async function fetchTokenBalance(walletAddress: string): Promise<number> {
  const config = getChainConfig();
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
      smartContractAddress: config.tokenAddress,
    },
    { apiKey: getKalpWalletApiKey(), baseUrl: getWalletApiBase() },
  );

  return parseBalanceNumber(data);
}
