import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useTreSori, type TreSoriContext } from "@/hooks/useTreSori";
import { getDefaultChainId } from "@/lib/sdkChain";
import { ChainListInstance } from "@kalp_studio/tresori-sdk-js";
import type { Chain } from "@kalp_studio/tresori-sdk-js";

type TreSoriProviderValue = TreSoriContext & {
  selectChainById: (chainId: string) => void;
};

const TreSoriContext = createContext<TreSoriProviderValue | null>(null);

function getApiKey(): string {
  return (import.meta.env.VITE_KALP_WALLET_API_KEY as string | undefined)?.trim() ?? "";
}

export function TreSoriProvider({ children }: { children: ReactNode }) {
  const sdk = useTreSori();

  useEffect(() => {
    const apiKey = getApiKey();
    if (apiKey && !sdk.initialized && !sdk.loading) {
      void sdk.initialize(apiKey);
    }
  }, [sdk.initialized, sdk.loading, sdk.initialize]);

  useEffect(() => {
    if (!sdk.initialized || sdk.chains.length === 0) return;
    const defaultId = getDefaultChainId();
    const match = ChainListInstance.ofChainId(defaultId);
    if (match) {
      sdk.setSelectedChain(match);
    }
  }, [sdk.initialized, sdk.chains.length, sdk.setSelectedChain]);

  const selectChainById = (chainId: string) => {
    const chain = ChainListInstance.ofChainId(chainId);
    if (chain) sdk.setSelectedChain(chain);
  };

  const value = useMemo(
    () => ({
      ...sdk,
      selectChainById,
    }),
    [sdk],
  );

  return <TreSoriContext.Provider value={value}>{children}</TreSoriContext.Provider>;
}

export function useTreSoriContext(): TreSoriProviderValue {
  const ctx = useContext(TreSoriContext);
  if (!ctx) {
    throw new Error("useTreSoriContext must be used within TreSoriProvider");
  }
  return ctx;
}

export function useSelectedChain(): Chain | null {
  return useTreSoriContext().selectedChain;
}
