import { useEffect, useState } from "react";
import { getTokenBalance } from "@/lib/sepoliaUsdtBalance";

type UsdtBalanceDisplayProps = {
  address: string;
  className?: string;
};

export function UsdtBalanceDisplay({ address, className }: UsdtBalanceDisplayProps) {
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    let cancelled = false;
    setError(null);

    getTokenBalance(address)
      .then((value) => {
        if (!cancelled) setBalance(value);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Failed to fetch balance");
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  if (error) return <span className={className}>Error: {error}</span>;
  if (balance === null) return <span className={className}>Token Balance: …</span>;
  return <span className={className}>Token Balance: {balance}</span>;
}
