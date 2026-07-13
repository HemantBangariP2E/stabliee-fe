import type { Chain, TreSori } from "@kalp_studio/tresori-sdk-js";
import { getFeeRecipient } from "@/lib/mpcTransfer";
import type { TransferMode } from "@/lib/mpcTransfer";

type TreSoriInstance = ReturnType<typeof TreSori>;

export function parseEstimatedFeeUsdt(payload: unknown): number {
  if (!payload || typeof payload !== "object") return 0;
  const root = payload as Record<string, unknown>;
  const result = (root.result ?? root) as Record<string, unknown>;
  if (typeof result !== "object" || result === null) return 0;

  for (const key of ["estimatedCostUsdt", "estimatedCost", "fee", "platformFee"]) {
    const n = parseFloat(String(result[key] ?? ""));
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return 0;
}

export type EstimateTransferFeeArgs = {
  tresori: TreSoriInstance;
  fromAddress: string;
  toAddress: string;
  amount: string;
  chain: Chain;
  tokenAddress: string;
  decimals?: number;
  transferMode: TransferMode;
  feeEnabled: boolean;
};

export async function estimateTransferPlatformFee({
  tresori,
  fromAddress,
  toAddress,
  amount,
  chain,
  tokenAddress,
  decimals = 6,
  transferMode,
  feeEnabled,
}: EstimateTransferFeeArgs): Promise<number> {
  if (!feeEnabled || !fromAddress || !toAddress || !amount.trim()) {
    return 0;
  }

  const amountTrimmed = amount.trim();
  if (Number.isNaN(Number(amountTrimmed)) || Number(amountTrimmed) <= 0) {
    return 0;
  }

  try {
    if (transferMode === "gasless" && tokenAddress) {
      const estimate = await tresori.getEstimatedGasFeeForGaslessTokenTransfer({
        fromAddress,
        toAddress,
        amount: amountTrimmed,
        chain,
        tokenAddress,
        decimals,
        platformFee: "0",
        feeRecipient: getFeeRecipient(chain),
      });
      return parseEstimatedFeeUsdt(estimate);
    }

    return 0;
  } catch {
    return 0;
  }
}
