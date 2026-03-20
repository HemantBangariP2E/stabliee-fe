import { useState, useEffect, useRef } from "react";
import {
  getAllTransactions,
  calculateTotals,
  type AlchemyNetwork,
} from "@/lib/alchemy";

export interface UseAlchemyTransactionsOptions {
  /** Network to query. Defaults to "base-sepolia" */
  network?: AlchemyNetwork;
  /** If true, skips fetching. Useful when address/token not ready. */
  enabled?: boolean;
}

export interface UseAlchemyTransactionsResult {
  sent: number;
  received: number;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches ERC20 sent/received totals for a wallet and token via Alchemy.
 * Uses a single batched call (getAllTransactions) to avoid duplicate requests.
 */
export function useAlchemyTransactions(
  address: string | null | undefined,
  tokenAddress: string | null | undefined,
  options: UseAlchemyTransactionsOptions = {}
): UseAlchemyTransactionsResult {
  const { network = "base-sepolia", enabled = true } = options;

  const [sent, setSent] = useState(0);
  const [received, setReceived] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<boolean>(false);
  const lastFetchRef = useRef<string>("");

  useEffect(() => {
    const key = `${address ?? ""}:${tokenAddress ?? ""}:${network}`;
    if (!address || !tokenAddress || !enabled) {
      setSent(0);
      setReceived(0);
      setLoading(false);
      setError(null);
      return;
    }

    if (lastFetchRef.current === key) {
      return;
    }
    lastFetchRef.current = key;
    abortRef.current = false;

    setLoading(true);
    setError(null);

    getAllTransactions(address, tokenAddress, network)
      .then((transactions) => {
        if (abortRef.current) return;
        const { sent: s, received: r } = calculateTotals(transactions, address);
        setSent(s);
        setReceived(r);
      })
      .catch((err) => {
        if (abortRef.current) return;
        const msg = err?.message ?? String(err);
        setError(msg);
        setSent(0);
        setReceived(0);
        if (import.meta.env.DEV) {
          console.error("[useAlchemyTransactions] Error:", err);
        }
      })
      .finally(() => {
        if (!abortRef.current) {
          setLoading(false);
        }
      });

    return () => {
      abortRef.current = true;
      lastFetchRef.current = "";
    };
  }, [address, tokenAddress, network, enabled]);

  return { sent, received, loading, error };
}
