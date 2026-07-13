import { useEffect, useRef, useState } from "react";
import type { Chain, TreSori } from "@kalp_studio/tresori-sdk-js";
import {
  calculateSdkTotals,
  fetchWalletTransactions,
  type SdkTransferTotals,
} from "@/lib/sdkTransactions";

type TreSoriInstance = ReturnType<typeof TreSori>;

type Options = {
  chain: Chain | null;
  tokenAddress?: string;
  enabled?: boolean;
};

type Result = SdkTransferTotals & {
  loading: boolean;
  error: string | null;
};

/** Sent/received totals from SDK `getWalletTransactions` for the active chain. */
export function useSdkWalletTransactions(
  tresori: TreSoriInstance,
  initialized: boolean,
  walletAddress: string | null | undefined,
  options: Options,
): Result {
  const { chain, tokenAddress, enabled = true } = options;
  const [sent, setSent] = useState(0);
  const [received, setReceived] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    if (!walletAddress || !chain || !initialized || !enabled) {
      setSent(0);
      setReceived(0);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    void fetchWalletTransactions(tresori, {
      chain,
      walletAddress,
      tokenAddress,
    })
      .then((transactions) => {
        if (abortRef.current) return;
        const totals = calculateSdkTotals(transactions, walletAddress);
        setSent(totals.sent);
        setReceived(totals.received);
      })
      .catch((err) => {
        if (abortRef.current) return;
        setSent(0);
        setReceived(0);
        setError((err as { message?: string })?.message ?? String(err));
      })
      .finally(() => {
        if (!abortRef.current) setLoading(false);
      });

    return () => {
      abortRef.current = true;
    };
  }, [tresori, initialized, walletAddress, chain, tokenAddress, enabled]);

  return { sent, received, loading, error };
}
