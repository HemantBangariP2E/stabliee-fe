import { ChainListInstance } from "@kalp_studio/tresori-sdk-js";
import type { Chain } from "@kalp_studio/tresori-sdk-js";

export function getDefaultChainId(): string {
  return (import.meta.env.VITE_DEFAULT_CHAIN_ID as string | undefined)?.trim() || "84532";
}

export function resolveSdkChain(chainId?: string): Chain | undefined {
  const id = chainId?.trim() || localStorage.getItem("chainIdConfig")?.trim() || getDefaultChainId();
  if (!ChainListInstance.isLoaded) return undefined;
  return ChainListInstance.ofChainId(id);
}

export function resolveSdkChainOrThrow(chainId?: string): Chain {
  const chain = resolveSdkChain(chainId);
  if (!chain) {
    throw new Error("Network not loaded. Please sign in again.");
  }
  return chain;
}
