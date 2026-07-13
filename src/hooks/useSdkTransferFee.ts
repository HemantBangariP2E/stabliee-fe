import { useEffect, useState } from "react";
import type { Chain, TreSori } from "@kalp_studio/tresori-sdk-js";
import type { TransferMode } from "@/lib/mpcTransfer";
import { estimateTransferPlatformFee } from "@/lib/sdkFees";

type TreSoriInstance = ReturnType<typeof TreSori>;

type Args = {
  tresori: TreSoriInstance;
  initialized: boolean;
  fromAddress?: string;
  toAddress?: string;
  amount: string;
  chain: Chain | null;
  tokenAddress: string;
  decimals?: number;
  transferMode: TransferMode;
  feeEnabled: boolean;
};

export function useSdkTransferFee({
  tresori,
  initialized,
  fromAddress,
  toAddress,
  amount,
  chain,
  tokenAddress,
  decimals = 6,
  transferMode,
  feeEnabled,
}: Args) {
  const [platformFee, setPlatformFee] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialized || !chain || !fromAddress || !toAddress || !feeEnabled || transferMode !== "gasless") {
      setPlatformFee(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      void estimateTransferPlatformFee({
        tresori,
        fromAddress,
        toAddress,
        amount,
        chain,
        tokenAddress,
        decimals,
        transferMode,
        feeEnabled,
      })
        .then((fee) => {
          if (!cancelled) setPlatformFee(fee);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    tresori,
    initialized,
    fromAddress,
    toAddress,
    amount,
    chain,
    tokenAddress,
    decimals,
    transferMode,
    feeEnabled,
  ]);

  return { platformFee, loading };
}
