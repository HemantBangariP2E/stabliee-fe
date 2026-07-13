import type { Chain, TreSori } from "@kalp_studio/tresori-sdk-js";
import { fetchTokenBalance as fetchTokenBalanceSdk } from "@/lib/chainBalances";
import { resolveSdkChainOrThrow } from "@/lib/sdkChain";

type TreSoriInstance = ReturnType<typeof TreSori>;

/** Fetch USDC balance for the active (or given) chain via SDK only. */
export async function fetchTokenBalance(
  tresori: TreSoriInstance,
  walletAddress: string,
  chainId?: string,
): Promise<number> {
  const chain: Chain = resolveSdkChainOrThrow(chainId);
  return fetchTokenBalanceSdk(tresori, walletAddress, chain);
}
