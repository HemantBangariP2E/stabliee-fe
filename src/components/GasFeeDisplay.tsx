import { useEffect, useState, useCallback } from "react";
import { JsonRpcProvider, formatUnits } from "ethers";

const RPC_URLS = {
  ethSepolia:
    (import.meta.env.VITE_ETH_SEPOLIA_RPC as string) ||
    "https://ethereum-sepolia-rpc.publicnode.com",
  baseSepolia: "https://sepolia.base.org",
  baseMainnet: "https://mainnet.base.org",
} as const;

function getRpcUrl(chain: "eth" | "base"): string {
  if (chain === "eth") return RPC_URLS.ethSepolia;
  const chainId =
    typeof window !== "undefined"
      ? localStorage.getItem("chainIdConfig")
      : null;
  if (chainId === "84532") return RPC_URLS.baseSepolia;
  return RPC_URLS.baseMainnet;
}

export type GasFeeData = {
  gasPrice: string | null;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
};

function toGwei(value: bigint | null | undefined): string | null {
  if (value == null) return null;
  try {
    return formatUnits(value, "gwei");
  } catch {
    return null;
  }
}

async function fetchGasForRpc(rpcUrl: string): Promise<GasFeeData> {
  const provider = new JsonRpcProvider(rpcUrl);
  const feeData = await provider.getFeeData();

  return {
    gasPrice: toGwei(feeData.gasPrice),
    maxFeePerGas: toGwei(feeData.maxFeePerGas),
    maxPriorityFeePerGas: toGwei(feeData.maxPriorityFeePerGas),
  };
}

function primaryGwei(data: GasFeeData | null): string | null {
  if (!data) return null;
  return (
    data.gasPrice ??
    data.maxFeePerGas ??
    data.maxPriorityFeePerGas ??
    null
  );
}

type GasFeeDisplayProps = {
  chain?: "eth" | "base" | "both";
  className?: string;
};

const REFRESH_MS = 15_000;
const DEFAULT_GAS_LIMIT = 21_000; // safer default
const ETH_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

/** Convert gwei → ETH using gas limit */
function gweiToEthEstimate(
  gweiStr: string | null,
  gasLimit = DEFAULT_GAS_LIMIT
): number | null {
  if (!gweiStr) return null;

  const g = Number(gweiStr);
  if (Number.isNaN(g)) return null;

  return g * 1e-9 * gasLimit;
}

export function GasFeeDisplay({
  chain = "both",
  className = "",
}: GasFeeDisplayProps) {
  const [baseData, setBaseData] = useState<GasFeeData | null>(null);
  const [ethData, setEthData] = useState<GasFeeData | null>(null);
  const [ethPriceUsd, setEthPriceUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchChain = useCallback(async (which: "base" | "eth") => {
    try {
      const url = getRpcUrl(which);
      const data = await fetchGasForRpc(url);
      return { which, data, err: false };
    } catch {
      return { which, data: null, err: true };
    }
  }, []);

  // Fetch ETH price
  useEffect(() => {
    let cancelled = false;

    const fetchEthPrice = async () => {
      try {
        const res = await fetch(ETH_PRICE_URL);
        if (!res.ok) return;

        const json = await res.json();
        if (!cancelled && json?.ethereum?.usd != null) {
          setEthPriceUsd(Number(json.ethereum.usd));
        }
      } catch {}
    };

    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 15 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Fetch gas data
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setError(false);
      setLoading(true);

      if (chain === "both") {
        const [baseResult, ethResult] = await Promise.all([
          fetchChain("base"),
          fetchChain("eth"),
        ]);

        if (cancelled) return;

        setBaseData(baseResult.err ? null : baseResult.data);
        setEthData(ethResult.err ? null : ethResult.data);
        setError(baseResult.err && ethResult.err);
      } else {
        const result = await fetchChain(chain);
        if (cancelled) return;

        if (chain === "base") {
          setBaseData(result.err ? null : result.data);
          setEthData(null);
        } else {
          setEthData(result.err ? null : result.data);
          setBaseData(null);
        }

        setError(result.err);
      }

      setLoading(false);
    };

    run();
    const interval = setInterval(run, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [chain, fetchChain]);

  if (loading && !baseData && !ethData) {
    return <div className={className}>Loading gas fee...</div>;
  }

  if (error && !baseData && !ethData) {
    return <div className={className}>Gas fee unavailable</div>;
  }

  const baseGwei = primaryGwei(baseData);
  const ethGwei = primaryGwei(ethData);

  const to6 = (v: number) => (Number.isNaN(v) ? "—" : v.toFixed(6));

  const formatEth = (gwei: string | null) => {
    const eth = gweiToEthEstimate(gwei);
    return eth != null ? to6(eth) : "—";
  };

  const formatUSD = (gwei: string | null) => {
    const eth = gweiToEthEstimate(gwei);
    if (eth == null || ethPriceUsd == null) return "—";
    return `$${to6(eth * ethPriceUsd)}`;
  };

  const renderLine = (label: string, gwei: string | null) => (
    <div>
      <span>{label} </span>
      <strong>{gwei ?? "—"} gwei</strong> ≈{" "}
      <strong>{formatEth(gwei)} ETH</strong> ≈{" "}
      <strong>{formatUSD(gwei)}</strong>
    </div>
  );

  return (
    <div className={className}>
      {(chain === "base" || chain === "both") && baseData &&
        renderLine("Base Gas:", baseGwei)}

      {(chain === "eth" || chain === "both") && ethData &&
        renderLine("ETH Gas:", ethGwei)}
    </div>
  );
}