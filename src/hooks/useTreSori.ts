import { useCallback, useMemo, useState } from "react";
import { TreSori, ChainListInstance } from "@kalp_studio/tresori-sdk-js";
import type { Chain } from "@kalp_studio/tresori-sdk-js";

export function useTreSori() {
  const tresori = useMemo(() => TreSori(), []);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chains, setChains] = useState<Chain[]>([]);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [mpcGaslessEnabled, setMpcGaslessEnabled] = useState(false);

  const initialize = useCallback(
    async (apiKey: string) => {
      setLoading(true);
      setError(null);
      try {
        await tresori.initialize(apiKey);
        const loaded = [...ChainListInstance.all];
        setChains(loaded);
        setSelectedChain(loaded[0] ?? null);
        setMpcGaslessEnabled(tresori.mpcGaslessEnabled);
        setInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setInitialized(false);
      } finally {
        setLoading(false);
      }
    },
    [tresori],
  );

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    tresori,
    initialized,
    loading,
    error,
    chains,
    selectedChain,
    setSelectedChain,
    mpcGaslessEnabled,
    initialize,
    run,
    clearError,
  };
}

export type TreSoriContext = ReturnType<typeof useTreSori>;
