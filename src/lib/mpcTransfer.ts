import type { Chain, TreSori } from "@kalp_studio/tresori-sdk-js";
import type { MpcSession } from "@/lib/walletSession";
import { resolveTokenAddress } from "@/lib/chains";

const USDC_DECIMALS = 6;

type TreSoriInstance = ReturnType<typeof TreSori>;

export function extractTxHash(result: unknown): string | null {
  if (!result || typeof result !== "object") {
    return typeof result === "string" ? result : null;
  }
  const r = result as Record<string, unknown>;
  if (typeof r.txHash === "string") return r.txHash;
  if (typeof r.transactionHash === "string") return r.transactionHash;
  if (r.result && typeof r.result === "object" && r.result !== null) {
    const nested = r.result as Record<string, unknown>;
    if (typeof nested.txHash === "string") return nested.txHash;
    if (typeof nested.transactionHash === "string") return nested.transactionHash;
  }
  return null;
}

export function getFeeRecipient(chain: Chain): string {
  const blockchain = chain.blockchain.toUpperCase();
  const chainId = chain.chainId;
  const isEthChain = blockchain === "ETH" || chainId === "1" || chainId === "11155111";
  return isEthChain
    ? "0xaAEd3fCdDEDA26F9AD0582698d9Be012e48D88aF"
    : "0x3eF4Bd3948976bD4Af03003E5bC0e109E016d563";
}

export type SendUsdcTransferArgs = {
  tresori: TreSoriInstance;
  session: MpcSession;
  chain: Chain;
  toAddress: string;
  amount: string;
  feeAmount?: number;
  mpcGaslessEnabled?: boolean;
};

export async function sendUsdcTransfer({
  tresori,
  session,
  chain,
  toAddress,
  amount,
  feeAmount = 0,
  mpcGaslessEnabled = false,
}: SendUsdcTransferArgs): Promise<string> {
  const tokenAddress = resolveTokenAddress();

  const result = await tresori.transferMpcTokens({
    fromAddress: session.walletAddress,
    toAddress,
    amount: amount.trim(),
    chain,
    clientShare: session.clientShare,
    sessionId: session.sessionId,
    userIdentity: session.email,
    tokenAddress,
    decimals: USDC_DECIMALS,
    isGasless: mpcGaslessEnabled ? undefined : false,
  });

  const approvalId = (result as { result?: { approvalId?: string } })?.result?.approvalId;
  if (approvalId) {
    throw new Error("Approval required. Please complete approval and try again.");
  }

  const txHash = extractTxHash(result);
  if (!txHash) {
    throw new Error("Transaction completed but no transaction hash was returned.");
  }

  if (feeAmount > 0) {
    const feeRecipient = getFeeRecipient(chain);
    const feeResult = await tresori.transferMpcTokens({
      fromAddress: session.walletAddress,
      toAddress: feeRecipient,
      amount: feeAmount.toString(),
      chain,
      clientShare: session.clientShare,
      sessionId: session.sessionId,
      userIdentity: session.email,
      tokenAddress,
      decimals: USDC_DECIMALS,
      isGasless: mpcGaslessEnabled ? undefined : false,
    });
    const feeTxHash = extractTxHash(feeResult);
    if (!feeTxHash) {
      console.warn("Fee transfer completed without tx hash");
    }
  }

  return txHash;
}

export type BulkRecipient = {
  to: string;
  amount: string;
};

export type BulkTransferProgress = {
  current: number;
  total: number;
};

export async function sendBulkUsdcTransfers({
  tresori,
  session,
  chain,
  recipients,
  feeAmount = 0,
  mpcGaslessEnabled = false,
  onProgress,
}: {
  tresori: TreSoriInstance;
  session: MpcSession;
  chain: Chain;
  recipients: BulkRecipient[];
  feeAmount?: number;
  mpcGaslessEnabled?: boolean;
  onProgress?: (progress: BulkTransferProgress) => void;
}): Promise<string[]> {
  const hashes: string[] = [];

  for (let i = 0; i < recipients.length; i++) {
    onProgress?.({ current: i + 1, total: recipients.length });
    const hash = await sendUsdcTransfer({
      tresori,
      session,
      chain,
      toAddress: recipients[i].to,
      amount: recipients[i].amount,
      mpcGaslessEnabled,
    });
    hashes.push(hash);
  }

  if (feeAmount > 0) {
    const feeRecipient = getFeeRecipient(chain);
    const tokenAddress = resolveTokenAddress();
    const feeResult = await tresori.transferMpcTokens({
      fromAddress: session.walletAddress,
      toAddress: feeRecipient,
      amount: feeAmount.toString(),
      chain,
      clientShare: session.clientShare,
      sessionId: session.sessionId,
      userIdentity: session.email,
      tokenAddress,
      decimals: USDC_DECIMALS,
      isGasless: mpcGaslessEnabled ? undefined : false,
    });
    const feeTxHash = extractTxHash(feeResult);
    if (feeTxHash) hashes.push(feeTxHash);
  }

  return hashes;
}
