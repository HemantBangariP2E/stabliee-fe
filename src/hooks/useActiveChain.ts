import { ChainListInstance } from "@kalp_studio/tresori-sdk-js";
import { useTreSoriContext } from "@/context/TreSoriProvider";
import { getActiveChainId } from "@/lib/walletSession";
import {
  getChainConfig,
  getConnectedNetworkDisplay,
  getTokenLabel,
  resolveTokenAddress,
  getNativeCurrencySymbol,
} from "@/lib/chains";

/** Single source of truth for the user's selected blockchain across the app. */
export function useActiveChain() {
  const { selectedChain, chains } = useTreSoriContext();

  const activeChainId =
    selectedChain?.chainId ?? getActiveChainId() ?? chains[0]?.chainId ?? "";

  const activeChain =
    selectedChain ??
    (activeChainId ? ChainListInstance.ofChainId(activeChainId) ?? null : null);

  const chainId = activeChain?.chainId ?? activeChainId;
  const blockchainName = activeChain?.blockchain;
  const networkDisplay = getConnectedNetworkDisplay(chainId, blockchainName);

  return {
    activeChain,
    activeChainId: chainId,
    chainConfig: getChainConfig(chainId, blockchainName),
    networkDisplay,
    networkLabel: activeChain
      ? `${activeChain.blockchain} ${activeChain.network}`
      : networkDisplay.name,
    tokenLabel: getTokenLabel(chainId, blockchainName),
    tokenAddress: resolveTokenAddress(chainId, blockchainName),
    nativeSymbol: activeChain
      ? getNativeCurrencySymbol(activeChain.chainId, activeChain.currency || "ETH")
      : "ETH",
  };
}
