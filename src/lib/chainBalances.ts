import type { Chain, TreSori } from "@kalp_studio/tresori-sdk-js";
import { getTokenAddressesForChain, getNativeCurrencySymbol } from "@/lib/chains";
import { parseBalanceNumber } from "@/lib/formatBalance";

export type ChainBalances = {
  native: number;
  nativeSymbol: string;
  usdc: number;
  usdt: number;
};

type TreSoriInstance = ReturnType<typeof TreSori>;

const BALANCE_OF_ABI = ["function balanceOf(address) view returns (uint256)"];

function rawToHuman(raw: unknown, decimals: number): number {
  if (raw === null || raw === undefined) return 0;
  try {
    const bi = typeof raw === "bigint" ? raw : BigInt(String(raw));
    return Number(bi) / 10 ** decimals;
  } catch {
    const n = Number(raw);
    return Number.isFinite(n) ? n / 10 ** decimals : 0;
  }
}

async function fetchNativeBalanceSdk(
  tresori: TreSoriInstance,
  walletAddress: string,
  chain: Chain,
): Promise<number> {
  try {
    const result = await tresori.getWalletBalance({
      address: walletAddress.trim(),
      chain,
    });
    return parseBalanceNumber(result);
  } catch {
    return 0;
  }
}

async function fetchErc20BalanceSdk(
  tresori: TreSoriInstance,
  walletAddress: string,
  chain: Chain,
  tokenAddress: string,
): Promise<number> {
  if (!tokenAddress) return 0;
  try {
    const decimals = await tresori.getTokenDecimals({
      tokenAddress,
      chainId: chain.chainId,
    });
    const raw = await tresori.readMpcSmartContractTransaction({
      contractAddress: tokenAddress,
      functionName: "balanceOf",
      params: [walletAddress.trim()],
      contractAbi: BALANCE_OF_ABI,
      chain,
    });
    return rawToHuman(raw, decimals);
  } catch {
    return 0;
  }
}

export async function fetchChainBalances(
  tresori: TreSoriInstance,
  walletAddress: string,
  chain: Chain,
): Promise<ChainBalances> {
  const { usdc: usdcAddress, usdt: usdtAddress } = getTokenAddressesForChain(chain.chainId);
  const nativeSymbol = getNativeCurrencySymbol(chain.chainId, chain.currency || "ETH");

  const [native, usdc, usdt] = await Promise.all([
    fetchNativeBalanceSdk(tresori, walletAddress, chain),
    usdcAddress ? fetchErc20BalanceSdk(tresori, walletAddress, chain, usdcAddress) : Promise.resolve(0),
    usdtAddress ? fetchErc20BalanceSdk(tresori, walletAddress, chain, usdtAddress) : Promise.resolve(0),
  ]);

  return { native, nativeSymbol, usdc, usdt };
}

export async function fetchTokenBalance(
  tresori: TreSoriInstance,
  walletAddress: string,
  chain: Chain,
): Promise<number> {
  const balances = await fetchChainBalances(tresori, walletAddress, chain);
  return balances.usdc;
}
