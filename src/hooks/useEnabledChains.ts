import { useState, useEffect } from "react";
import {
  fetchEmbeddedWalletConfig,
  getEnabledChainsFromConfig,
  type ChainEntry,
} from "@/lib/walletApi";

const CACHE_KEY = "cachedEnabledChains";
const CACHE_VERSION = "v3";
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Hardcoded fallback: exactly the chains from blockchainNetworkConfig.
 * Used when the API is unreachable. Logo URLs match the API response.
 */
const FALLBACK_CHAINS: ChainEntry[] = [
  // ── MAINNET ──────────────────────────────────────────────────────────────
  {
    id: 20, blockchain: "BASE", network: "MAINNET", chainId: "8453",
    rpcProvider: "INFURA", rpcUrl: "https://base-mainnet.infura.io/v3/",
    explorerUrl: "https://basescan.org", currency: "ETH",
    logo: "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/blockChainCurrencySymbol/base.svg",
    permissions: ["DEFAULT"], isEnabled: true,
  },
  // ── TESTNET ──────────────────────────────────────────────────────────────
  {
    id: 22, blockchain: "BSC", network: "TESTNET", chainId: "97",
    rpcProvider: "INFURA", rpcUrl: "https://bsc-testnet.infura.io/v3/",
    explorerUrl: "https://testnet.bscscan.com", currency: "BNB",
    logo: "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/blockChainCurrencySymbol/binance.svg",
    permissions: ["DEFAULT"], isEnabled: true,
  },
  {
    id: 29, blockchain: "ETH", network: "SEPOLIA", chainId: "11155111",
    rpcProvider: "INFURA", rpcUrl: "https://sepolia.infura.io/v3/",
    explorerUrl: "https://sepolia.etherscan.io", currency: "ETH",
    logo: "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/blockChainCurrencySymbol/ethereum.svg",
    permissions: ["DEFAULT"], isEnabled: true,
  },
  {
    id: 38, blockchain: "KALP", network: "NEWTESTNET", chainId: "19031998",
    rpcProvider: "KALPTANTRA", rpcUrl: "https://kalp.infura.io/v3/",
    explorerUrl: "https://kalpscan.io/home", currency: "GINI",
    logo: "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/302e33333735373434333032353630323537341755508661269.svg",
    permissions: ["DEFAULT"], isEnabled: true,
  },
  {
    id: 18, blockchain: "POLY", network: "AMOY", chainId: "80002",
    rpcProvider: "INFURA", rpcUrl: "https://polygon-amoy.infura.io/v3/",
    explorerUrl: "https://amoy.polygonscan.com", currency: "POL",
    logo: "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/blockChainCurrencySymbol/polygon.svg",
    permissions: ["DEFAULT"], isEnabled: true,
  },
  {
    id: 54, blockchain: "TRON", network: "NILE", chainId: "201910292",
    rpcProvider: "TRONGRID", rpcUrl: "https://api.nileex.io",
    explorerUrl: "https://nile.tronscan.org", currency: "TRX",
    logo: "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/302e3838333636313539363130323534341755068926648.svg",
    permissions: ["DEFAULT"], isEnabled: true,
  },
  {
    id: 16, blockchain: "TRON", network: "SHASTA", chainId: "201910292",
    rpcProvider: "TRONGRID", rpcUrl: "https://api.shasta.trongrid.io",
    explorerUrl: "https://shasta.tronscan.org", currency: "TRX",
    logo: "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/302e3838333636313539363130323534341755068926648.svg",
    permissions: ["DEFAULT"], isEnabled: true,
  },
  {
    id: 64, blockchain: "ADI", network: "TESTNET", chainId: "99999",
    rpcProvider: "ADI Foundation", rpcUrl: "https://rpc.ab.testnet.adifoundation.ai",
    explorerUrl: "https://explorer.ab.testnet.adifoundation.ai", currency: "ADI",
    logo: "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/blockChainCurrencySymbol/adi.png",
    permissions: ["DEFAULT"], isEnabled: true,
  },
  {
    id: 23, blockchain: "BASE", network: "SEPOLIA", chainId: "84532",
    rpcProvider: "INFURA", rpcUrl: "https://base-sepolia.infura.io/v3/",
    explorerUrl: "https://sepolia.basescan.org", currency: "ETH",
    logo: "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/blockChainCurrencySymbol/base.svg",
    permissions: ["DEFAULT"], isEnabled: true,
  },
];

function readCache(): ChainEntry[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { chains, ts, v } = JSON.parse(raw) as { chains: ChainEntry[]; ts: number; v?: string };
    if (v !== CACHE_VERSION || Date.now() - ts > CACHE_TTL_MS) return null;
    return chains;
  } catch {
    return null;
  }
}

function writeCache(chains: ChainEntry[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ chains, ts: Date.now(), v: CACHE_VERSION }));
  } catch { /* ignore */ }
}

export function useEnabledChains() {
  const [chains, setChains] = useState<ChainEntry[]>(() => readCache() ?? FALLBACK_CHAINS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Always try to fetch fresh config from API (will enrich/update the list)
    let cancelled = false;

    const cached = readCache();
    if (cached) {
      setChains(cached);
      return;
    }

    setLoading(true);
    fetchEmbeddedWalletConfig()
      .then((cfg) => {
        if (cancelled) return;
        if (cfg) {
          const enabled = getEnabledChainsFromConfig(cfg);
          if (enabled.length) {
            writeCache(enabled);
            setChains(enabled);
            setLoading(false);
            return;
          }
        }
        // API unreachable or returned no chains — use hardcoded fallback
        writeCache(FALLBACK_CHAINS);
        setChains(FALLBACK_CHAINS);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        // Keep already-set FALLBACK_CHAINS, just stop loading
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const mainnetChains = chains.filter((c) =>
    c.network?.toUpperCase() === "MAINNET"
  );
  const testnetChains = chains.filter((c) =>
    c.network?.toUpperCase() !== "MAINNET"
  );

  return { chains, mainnetChains, testnetChains, loading };
}
