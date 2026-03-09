import { useEffect, useState, useCallback } from "react";
import { JsonRpcProvider, formatUnits } from "ethers";

const RPC_URLS = {
  ethSepolia: (import.meta.env.VITE_ETH_SEPOLIA_RPC as string) || "https://ethereum-sepolia-rpc.publicnode.com",
  baseSepolia: "https://sepolia.base.org",
  baseMainnet: "https://mainnet.base.org",
} as const;

function getRpcUrl(chain: "eth" | "base"): string {
  if (chain === "eth") return RPC_URLS.ethSepolia;
  const chainId = typeof window !== "undefined" ? localStorage.getItem("chainIdConfig") : null;
  if (chainId === "84532") return RPC_URLS.baseSepolia;
  return RPC_URLS.baseMainnet;
}

export type GasFeeData = {
  gasPrice: string | null;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
};

function toGwei(value: bigint | null | undefined): string | null {
  if (value == null || value === undefined) return null;
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
  return data.gasPrice ?? data.maxFeePerGas ?? data.maxPriorityFeePerGas ?? null;
}

type GasFeeDisplayProps = {
  chain?: "eth" | "base" | "both";
  className?: string;
};

const REFRESH_MS = 15_000;
const GAS_LIMIT_ESTIMATE = 65_000; // typical ERC20 transfer
const ETH_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

function gweiToEthEstimate(gweiStr: string | null): number | null {
  if (gweiStr == null) return null;
  const g = parseFloat(gweiStr);
  if (Number.isNaN(g)) return null;
  return (g * 1e-9) * GAS_LIMIT_ESTIMATE;
}

export function GasFeeDisplay({ chain = "both", className = "" }: GasFeeDisplayProps) {
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

  const ETH_PRICE_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes to avoid 429
  useEffect(() => {
    let cancelled = false;
    const fetchEthPrice = async () => {
      try {
        const res = await fetch(ETH_PRICE_URL);
        if (!res.ok) return; // e.g. 429: keep last price
        const json = await res.json();
        if (!cancelled && json?.ethereum?.usd != null) setEthPriceUsd(Number(json.ethereum.usd));
      } catch {
        // keep last price on error
      }
    };
    fetchEthPrice();
    const priceInterval = setInterval(fetchEthPrice, ETH_PRICE_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(priceInterval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setError(false);
      if (chain === "both") {
        setLoading(true);
        const [baseResult, ethResult] = await Promise.all([
          fetchChain("base"),
          fetchChain("eth"),
        ]);
        if (cancelled) return;
        setBaseData(baseResult.err ? null : baseResult.data);
        setEthData(ethResult.err ? null : ethResult.data);
        setError(baseResult.err && ethResult.err);
      } else if (chain === "base") {
        setLoading(true);
        const result = await fetchChain("base");
        if (cancelled) return;
        setBaseData(result.err ? null : result.data);
        setEthData(null);
        setError(result.err);
      } else {
        setLoading(true);
        const result = await fetchChain("eth");
        if (cancelled) return;
        setEthData(result.err ? null : result.data);
        setBaseData(null);
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
    return (
      <div className={className}>
        <span className="text-muted-foreground">Network Fee: </span>
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  if (error && !baseData && !ethData) {
    return (
      <div className={className}>
        <span className="text-muted-foreground">Network Fee: </span>
        <span className="text-muted-foreground">Unavailable</span>
      </div>
    );
  }

  const showBase = (chain === "base" || chain === "both") && baseData;
  const showEth = (chain === "eth" || chain === "both") && ethData;
  const baseGwei = primaryGwei(baseData);
  const ethGwei = primaryGwei(ethData);

  const to6 = (v: number): string => (Number.isNaN(v) ? "—" : v.toFixed(6));
  const gweiTo6 = (s: string | null): string => (s != null ? to6(parseFloat(s)) : "—");

  const formatFeeEth = (gweiStr: string | null): string => {
    const eth = gweiToEthEstimate(gweiStr);
    if (eth == null) return "—";
    return to6(eth);
  };

  const formatFeeUsd = (gweiStr: string | null): string => {
    const eth = gweiToEthEstimate(gweiStr);
    if (eth == null || ethPriceUsd == null) return "—";
    const usd = eth * ethPriceUsd;
    return `$${to6(usd)}`;
  };

  const renderGasLine = (label: string, gweiStr: string | null) => (
    <div className="space-y-0.5">
      <div>
        <span className="text-muted-foreground">{label} </span>
        <span className="font-medium tabular-nums">{gweiTo6(gweiStr)} gwei</span>
        <span className="text-muted-foreground"> ≈ </span>
        <span className="font-medium tabular-nums">{formatFeeEth(gweiStr)} ETH</span>
        <span className="text-muted-foreground"> ≈ </span>
        <span className="font-medium tabular-nums">{formatFeeUsd(gweiStr)}</span>
      </div>
    </div>
  );

  const renderDetails = (data: GasFeeData | null) => {
    if (!data) return null;
    const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = data;
    return (
      <div className="mt-1 space-y-0.5 pl-0 text-muted-foreground">
        {gasPrice != null && <div>Gas Price: {gweiTo6(gasPrice)} gwei</div>}
        {maxFeePerGas != null && <div>Max Fee: {gweiTo6(maxFeePerGas)} gwei</div>}
        {maxPriorityFeePerGas != null && <div>Priority Fee: {gweiTo6(maxPriorityFeePerGas)} gwei</div>}
      </div>
    );
  };

  if (chain === "both") {
    return (
      <div className={`space-y-2 ${className}`}>
        {showBase && (
          <div>
            {renderGasLine("Network Gas (Base):", baseGwei)}
            {renderDetails(baseData)}
          </div>
        )}
        {showEth && (
          <div>
            {renderGasLine("Network Gas (ETH):", ethGwei)}
            {renderDetails(ethData)}
          </div>
        )}
        {!showBase && !showEth && (
          <div>
            <span className="text-muted-foreground">Network Fee: </span>
            <span className="text-muted-foreground">Unavailable</span>
          </div>
        )}
      </div>
    );
  }

  const gwei = chain === "base" ? baseGwei : ethGwei;
  const data = chain === "base" ? baseData : ethData;
  return (
    <div className={className}>
      {renderGasLine("Network Gas:", gwei)}
      {renderDetails(data)}
    </div>
  );
}
