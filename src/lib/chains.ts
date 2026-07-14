import type { AlchemyNetwork } from "@/lib/alchemy";

export const CHAIN_IDS = {
  ETH_MAINNET: "1",
  ETH_SEPOLIA: "11155111",
  BASE_MAINNET: "8453",
  BASE_SEPOLIA: "84532",
  POLYGON_MAINNET: "137",
  POLYGON_AMOY: "80002",
  SCROLL_SEPOLIA: "534351",
  SCROLL_MAINNET: "534352",
  ZKSYNC_SEPOLIA: "300",
  ZKSYNC_MAINNET: "324",
  MANTLE_MAINNET: "5000",
  MANTLE_TESTNET: "5001",
  MANTLE_SEPOLIA: "5003",
  BLAST_MAINNET: "81457",
  BLAST_SEPOLIA: "168587773",
  CELO_MAINNET: "42220",
  CELO_ALFAJORES: "44787",
  CELO_SEPOLIA: "11142220",
  PALM_MAINNET: "11297108109",
  PALM_TESTNET: "11297108099",
  LINEA_MAINNET: "59144",
  LINEA_SEPOLIA: "59141",
  ARBITRUM_MAINNET: "42161",
  ARBITRUM_SEPOLIA: "421614",
  OPTIMISM_MAINNET: "10",
  OPTIMISM_SEPOLIA: "11155420",
  AVALANCHE_MAINNET: "43114",
  AVALANCHE_FUJI: "43113",
  BSC_MAINNET: "56",
  BSC_TESTNET: "97",
  // KALP
  KALP_MAINNET: "19031997",
  KALP_NEWTESTNET: "19031998",
  // TRON
  TRON_MAINNET: "728126428",
  TRON_NILE: "201910292",   // Nile testnet (same chainId as Shasta in API)
  TRON_SHASTA: "201910291", // disambiguated locally
  // ADI
  ADI_TESTNET: "99999",
} as const;

/** Canonical chain descriptor — shape matches the API's chainsAndNetworks entries. */
export type SupportedChain = {
  chainId: string;
  blockchain: string;
  network: string;
  displayName: string;
  currency: string;
  explorerUrl: string;
  logo: string;
  isMainnet: boolean;
};

const KALP_LOGO = "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/302e33333735373434333032353630323537341755508661269.svg";
const TRON_LOGO = "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/302e3838333636313539363130323534341755068926648.svg";
const ETH_LOGO   = "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/blockChainCurrencySymbol/ethereum.svg";
const BASE_LOGO  = "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/blockChainCurrencySymbol/base.svg";
const BSC_LOGO   = "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/blockChainCurrencySymbol/binance.svg";
const POLY_LOGO  = "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/blockChainCurrencySymbol/polygon.svg";
const ADI_LOGO   = "https://qa-ks-root-be.s3.ap-south-1.amazonaws.com/blockChainCurrencySymbol/adi.png";

/** All chains supported by the platform — split into mainnet / testnet. */
export const SUPPORTED_CHAINS: SupportedChain[] = [
  // ── MAINNET ────────────────────────────────────────────────────────────────
  { chainId: "8453",      blockchain: "BASE", network: "MAINNET",    displayName: "Base",             currency: "ETH",  explorerUrl: "https://basescan.org",           logo: BASE_LOGO,  isMainnet: true  },
  { chainId: "56",        blockchain: "BSC",  network: "MAINNET",    displayName: "BNB Chain",        currency: "BNB",  explorerUrl: "https://bscscan.com",            logo: BSC_LOGO,   isMainnet: true  },
  { chainId: "1",         blockchain: "ETH",  network: "MAINNET",    displayName: "Ethereum",         currency: "ETH",  explorerUrl: "https://etherscan.io",           logo: ETH_LOGO,   isMainnet: true  },
  { chainId: "19031997",  blockchain: "KALP", network: "MAINNET",    displayName: "KALP",             currency: "GINI", explorerUrl: "https://explorer.kalp.network",  logo: KALP_LOGO,  isMainnet: true  },
  { chainId: "137",       blockchain: "POLY", network: "MAINNET",    displayName: "Polygon",          currency: "POL",  explorerUrl: "https://polygonscan.com",        logo: POLY_LOGO,  isMainnet: true  },
  { chainId: "728126428", blockchain: "TRON", network: "MAINNET",    displayName: "TRON",             currency: "TRX",  explorerUrl: "https://tronscan.org",           logo: TRON_LOGO,  isMainnet: true  },
  // ── TESTNET ────────────────────────────────────────────────────────────────
  { chainId: "99999",     blockchain: "ADI",  network: "TESTNET",    displayName: "ADI Testnet",      currency: "ADI",  explorerUrl: "https://explorer.ab.testnet.adifoundation.ai", logo: ADI_LOGO,  isMainnet: false },
  { chainId: "84532",     blockchain: "BASE", network: "SEPOLIA",    displayName: "Base Sepolia",     currency: "ETH",  explorerUrl: "https://sepolia.basescan.org",   logo: BASE_LOGO,  isMainnet: false },
  { chainId: "97",        blockchain: "BSC",  network: "TESTNET",    displayName: "BNB Testnet",      currency: "BNB",  explorerUrl: "https://testnet.bscscan.com",    logo: BSC_LOGO,   isMainnet: false },
  { chainId: "11155111",  blockchain: "ETH",  network: "SEPOLIA",    displayName: "Ethereum Sepolia", currency: "ETH",  explorerUrl: "https://sepolia.etherscan.io",   logo: ETH_LOGO,   isMainnet: false },
  { chainId: "19031998",  blockchain: "KALP", network: "NEWTESTNET", displayName: "KALP Testnet",     currency: "GINI", explorerUrl: "https://kalpscan.io/home",        logo: KALP_LOGO,  isMainnet: false },
  { chainId: "80002",     blockchain: "POLY", network: "AMOY",       displayName: "Polygon Amoy",     currency: "POL",  explorerUrl: "https://amoy.polygonscan.com",   logo: POLY_LOGO,  isMainnet: false },
  { chainId: "201910292", blockchain: "TRON", network: "NILE",       displayName: "TRON Nile",        currency: "TRX",  explorerUrl: "https://nile.tronscan.org",       logo: TRON_LOGO,  isMainnet: false },
  { chainId: "201910292", blockchain: "TRON", network: "SHASTA",     displayName: "TRON Shasta",      currency: "TRX",  explorerUrl: "https://shasta.tronscan.org",     logo: TRON_LOGO,  isMainnet: false },
];

export const MAINNET_CHAINS = SUPPORTED_CHAINS.filter((c) => c.isMainnet);
export const TESTNET_CHAINS = SUPPORTED_CHAINS.filter((c) => !c.isMainnet);

/** Write a chain selection to localStorage and notify all listeners. */
export function setActiveChain(chain: SupportedChain): void {
  localStorage.setItem("chainIdConfig", chain.chainId);
  localStorage.setItem("blockchainName", chain.blockchain);
  localStorage.setItem("networkName", chain.network);
  // Clear nativeToken so getChainConfig resolves from CHAIN_REGISTRY
  localStorage.removeItem("nativeToken");
  window.dispatchEvent(new Event("chainChanged"));
}

/** Read the currently active chain from localStorage. */
export function getActiveChain(): SupportedChain | null {
  const chainId = localStorage.getItem("chainIdConfig") || "";
  const blockchain = (localStorage.getItem("blockchainName") || "").toUpperCase();
  const network = (localStorage.getItem("networkName") || "").toUpperCase();

  if (!chainId && !blockchain) return null;

  return (
    SUPPORTED_CHAINS.find(
      (c) =>
        c.chainId === chainId ||
        (c.blockchain === blockchain && c.network === network)
    ) ?? null
  );
}

/** Saved multi-chain selection (stored as JSON in localStorage). */
const ENABLED_CHAINS_KEY = "enabledChainIds";

export function getEnabledChains(): string[] {
  try {
    return JSON.parse(localStorage.getItem(ENABLED_CHAINS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function setEnabledChains(chainIds: string[]): void {
  localStorage.setItem(ENABLED_CHAINS_KEY, JSON.stringify(chainIds));
  window.dispatchEvent(new Event("chainChanged"));
}

// export const ETH_USDT_TOKEN = "0x6df25D580C2354431C464f25aDee4e7a8c6c72c8";//usdt
// export const ETH_USDT_TOKEN = "0x5aEC77A2CBE8ee9D359F965826BdDFa026DfFb38";//usdc 
export const ETH_USDT_TOKEN = "0x6df25D580C2354431C464f25aDee4e7a8c6c72c8";//usdt


export const BASE_USDC_TOKEN = "0x1ad8c3B424fC925D75CCFE8dA049A4c245bFa913";
export const POLYGON_AMOY_TOKEN = "0x5BC94481A667b90e5BA31411536f3aCB804FAA57";
/** Kalp alpha USDC — same CREATE2 address on Scroll, zkSync, Mantle, Blast, Celo, Palm, Linea, etc. */
export const ALPHA_USDC_TOKEN = "0xde987ff60a72d14e3c2cdb6975c8c60c3d299da2";

export const SCROLL_SEPOLIA_TOKEN = ALPHA_USDC_TOKEN;
export const ZKSYNC_SEPOLIA_TOKEN = ALPHA_USDC_TOKEN;

export type ChainConfig = {
  chainId: string;
  tokenAddress: string;
  currency: string;
  tokenLabel: string;
  displayName: string;
  alchemyNetwork?: AlchemyNetwork;
  isBase: boolean;
  isPolygon: boolean;
};

type ChainEntry = ChainConfig;

const usdcAlpha = (overrides: Omit<ChainEntry, "tokenAddress" | "currency" | "tokenLabel" | "isBase" | "isPolygon">): ChainEntry => ({
  ...overrides,
  tokenAddress: ALPHA_USDC_TOKEN,
  currency: "USDC",
  tokenLabel: "USDC",
  isBase: false,
  isPolygon: false,
});

/** Authoritative per-chainId config — checked before blockchain-name heuristics. */
export const CHAIN_REGISTRY: Record<string, ChainEntry> = {
  [CHAIN_IDS.ETH_MAINNET]: {
    chainId: CHAIN_IDS.ETH_MAINNET,
    tokenAddress: ETH_USDT_TOKEN,
    currency: "USDT",
    tokenLabel: "USDT",
    displayName: "Ethereum",
    isBase: false,
    isPolygon: false,
  },
  [CHAIN_IDS.ETH_SEPOLIA]: {
    chainId: CHAIN_IDS.ETH_SEPOLIA,
    tokenAddress: ETH_USDT_TOKEN,
    currency: "USDT",
    tokenLabel: "USDT",
    displayName: "Ethereum (Sepolia)",
    alchemyNetwork: "eth-sepolia",
    isBase: false,
    isPolygon: false,
  },
  [CHAIN_IDS.BASE_MAINNET]: {
    chainId: CHAIN_IDS.BASE_MAINNET,
    tokenAddress: BASE_USDC_TOKEN,
    currency: "USDC",
    tokenLabel: "USDC",
    displayName: "Base",
    isBase: true,
    isPolygon: false,
  },
  [CHAIN_IDS.BASE_SEPOLIA]: {
    chainId: CHAIN_IDS.BASE_SEPOLIA,
    tokenAddress: BASE_USDC_TOKEN,
    currency: "USDC",
    tokenLabel: "USDC",
    displayName: "Base Sepolia",
    alchemyNetwork: "base-sepolia",
    isBase: true,
    isPolygon: false,
  },
  [CHAIN_IDS.POLYGON_MAINNET]: {
    chainId: CHAIN_IDS.POLYGON_MAINNET,
    tokenAddress: POLYGON_AMOY_TOKEN,
    currency: "USDC",
    tokenLabel: "USDC",
    displayName: "Polygon",
    isBase: false,
    isPolygon: true,
  },
  [CHAIN_IDS.POLYGON_AMOY]: {
    chainId: CHAIN_IDS.POLYGON_AMOY,
    tokenAddress: POLYGON_AMOY_TOKEN,
    currency: "USDC",
    tokenLabel: "USDC",
    displayName: "Polygon Amoy",
    isBase: false,
    isPolygon: true,
  },
  [CHAIN_IDS.KALP_MAINNET]: usdcAlpha({ chainId: CHAIN_IDS.KALP_MAINNET, displayName: "KALP" }),
  [CHAIN_IDS.KALP_NEWTESTNET]: usdcAlpha({ chainId: CHAIN_IDS.KALP_NEWTESTNET, displayName: "KALP Testnet" }),
  [CHAIN_IDS.TRON_MAINNET]: usdcAlpha({ chainId: CHAIN_IDS.TRON_MAINNET, displayName: "TRON" }),
  [CHAIN_IDS.TRON_NILE]: usdcAlpha({ chainId: CHAIN_IDS.TRON_NILE, displayName: "TRON Nile" }),
  [CHAIN_IDS.ADI_TESTNET]: usdcAlpha({ chainId: CHAIN_IDS.ADI_TESTNET, displayName: "ADI Testnet" }),
  [CHAIN_IDS.SCROLL_SEPOLIA]: usdcAlpha({ chainId: CHAIN_IDS.SCROLL_SEPOLIA, displayName: "Scroll Sepolia" }),
  [CHAIN_IDS.SCROLL_MAINNET]: usdcAlpha({ chainId: CHAIN_IDS.SCROLL_MAINNET, displayName: "Scroll" }),
  [CHAIN_IDS.ZKSYNC_SEPOLIA]: usdcAlpha({ chainId: CHAIN_IDS.ZKSYNC_SEPOLIA, displayName: "zkSync Sepolia" }),
  [CHAIN_IDS.ZKSYNC_MAINNET]: usdcAlpha({ chainId: CHAIN_IDS.ZKSYNC_MAINNET, displayName: "zkSync" }),
  [CHAIN_IDS.MANTLE_MAINNET]: usdcAlpha({ chainId: CHAIN_IDS.MANTLE_MAINNET, displayName: "Mantle" }),
  [CHAIN_IDS.MANTLE_TESTNET]: usdcAlpha({ chainId: CHAIN_IDS.MANTLE_TESTNET, displayName: "Mantle Testnet" }),
  [CHAIN_IDS.MANTLE_SEPOLIA]: usdcAlpha({ chainId: CHAIN_IDS.MANTLE_SEPOLIA, displayName: "Mantle Sepolia" }),
  [CHAIN_IDS.BLAST_MAINNET]: usdcAlpha({ chainId: CHAIN_IDS.BLAST_MAINNET, displayName: "Blast" }),
  [CHAIN_IDS.BLAST_SEPOLIA]: usdcAlpha({ chainId: CHAIN_IDS.BLAST_SEPOLIA, displayName: "Blast Sepolia" }),
  [CHAIN_IDS.CELO_MAINNET]: usdcAlpha({ chainId: CHAIN_IDS.CELO_MAINNET, displayName: "Celo" }),
  [CHAIN_IDS.CELO_ALFAJORES]: usdcAlpha({ chainId: CHAIN_IDS.CELO_ALFAJORES, displayName: "Celo Alfajores" }),
  [CHAIN_IDS.CELO_SEPOLIA]: usdcAlpha({ chainId: CHAIN_IDS.CELO_SEPOLIA, displayName: "Celo Sepolia" }),
  [CHAIN_IDS.PALM_MAINNET]: usdcAlpha({ chainId: CHAIN_IDS.PALM_MAINNET, displayName: "Palm" }),
  [CHAIN_IDS.PALM_TESTNET]: usdcAlpha({ chainId: CHAIN_IDS.PALM_TESTNET, displayName: "Palm Testnet" }),
  [CHAIN_IDS.LINEA_MAINNET]: usdcAlpha({ chainId: CHAIN_IDS.LINEA_MAINNET, displayName: "Linea" }),
  [CHAIN_IDS.LINEA_SEPOLIA]: usdcAlpha({ chainId: CHAIN_IDS.LINEA_SEPOLIA, displayName: "Linea Sepolia" }),
  [CHAIN_IDS.ARBITRUM_MAINNET]: usdcAlpha({ chainId: CHAIN_IDS.ARBITRUM_MAINNET, displayName: "Arbitrum" }),
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: usdcAlpha({ chainId: CHAIN_IDS.ARBITRUM_SEPOLIA, displayName: "Arbitrum Sepolia" }),
  [CHAIN_IDS.OPTIMISM_MAINNET]: usdcAlpha({ chainId: CHAIN_IDS.OPTIMISM_MAINNET, displayName: "Optimism" }),
  [CHAIN_IDS.OPTIMISM_SEPOLIA]: usdcAlpha({ chainId: CHAIN_IDS.OPTIMISM_SEPOLIA, displayName: "Optimism Sepolia" }),
  [CHAIN_IDS.AVALANCHE_MAINNET]: usdcAlpha({ chainId: CHAIN_IDS.AVALANCHE_MAINNET, displayName: "Avalanche" }),
  [CHAIN_IDS.AVALANCHE_FUJI]: usdcAlpha({ chainId: CHAIN_IDS.AVALANCHE_FUJI, displayName: "Avalanche Fuji" }),
  [CHAIN_IDS.BSC_MAINNET]: usdcAlpha({ chainId: CHAIN_IDS.BSC_MAINNET, displayName: "BNB Chain" }),
  [CHAIN_IDS.BSC_TESTNET]: usdcAlpha({ chainId: CHAIN_IDS.BSC_TESTNET, displayName: "BNB Testnet" }),
};

function readStorage(): { chainId: string; blockchainName: string; networkName: string } {
  if (typeof window === "undefined") {
    return { chainId: "", blockchainName: "BASE", networkName: "" };
  }
  return {
    chainId: localStorage.getItem("chainIdConfig") || "",
    blockchainName: (localStorage.getItem("blockchainName") || "BASE").toUpperCase(),
    networkName: (localStorage.getItem("networkName") || "").toUpperCase(),
  };
}

function isMainnetNetwork(networkName: string): boolean {
  return networkName.includes("MAINNET");
}

function isPolygonBlockchainName(name: string): boolean {
  return name === "POLYGON" || name === "POLY" || name === "MATIC" || name === "POL";
}

function isScrollBlockchainName(name: string): boolean {
  return name === "SCROLL" || name === "SCRL";
}

function isZkSyncBlockchainName(name: string): boolean {
  return name === "ZKSYNC" || name === "ZKS";
}

function isMantleBlockchainName(name: string): boolean {
  return name === "MANTLE" || name === "MLT";
}

function isBlastBlockchainName(name: string): boolean {
  return name === "BLAST";
}

function isCeloBlockchainName(name: string): boolean {
  return name === "CELO";
}

function isPalmBlockchainName(name: string): boolean {
  return name === "PALM";
}

function isLineaBlockchainName(name: string): boolean {
  return name === "LINEA" || name === "LIN" || name === "LENA";
}

function isArbitrumBlockchainName(name: string): boolean {
  return name === "ARBITRUM" || name === "ARB";
}

function isOptimismBlockchainName(name: string): boolean {
  return name === "OPTIMISM" || name === "OP";
}

function isAvalancheBlockchainName(name: string): boolean {
  return name === "AVALANCHE" || name === "AVAX";
}

function isBscBlockchainName(name: string): boolean {
  return name === "BSC" || name === "BNB";
}

export function isEthChain(chainId?: string, blockchainName?: string): boolean {
  const { chainId: id, blockchainName: name } =
    chainId !== undefined && blockchainName !== undefined
      ? { chainId, blockchainName: blockchainName.toUpperCase() }
      : readStorage();
  return name === "ETH" || id === CHAIN_IDS.ETH_SEPOLIA || id === CHAIN_IDS.ETH_MAINNET;
}

export function isPolygonChain(chainId?: string, blockchainName?: string): boolean {
  const stored = readStorage();
  const id = chainId ?? stored.chainId;
  const name = (blockchainName ?? stored.blockchainName).toUpperCase();
  const networkName = stored.networkName;

  if (id === CHAIN_IDS.POLYGON_AMOY) return true;
  if (!isPolygonBlockchainName(name)) return false;
  if (networkName.includes("AMOY")) return true;
  if (!networkName || !networkName.includes("MAINNET")) return true;
  return false;
}

export function isScrollChain(chainId?: string, blockchainName?: string): boolean {
  const stored = readStorage();
  const id = chainId ?? stored.chainId;
  const name = (blockchainName ?? stored.blockchainName).toUpperCase();
  const networkName = stored.networkName;

  if (id === CHAIN_IDS.SCROLL_SEPOLIA || id === CHAIN_IDS.SCROLL_MAINNET) return true;
  if (!isScrollBlockchainName(name)) return false;
  return !networkName || !networkName.includes("MAINNET");
}

export function isZkSyncChain(chainId?: string, blockchainName?: string): boolean {
  const stored = readStorage();
  const id = chainId ?? stored.chainId;
  const name = (blockchainName ?? stored.blockchainName).toUpperCase();
  const networkName = stored.networkName;

  if (id === CHAIN_IDS.ZKSYNC_SEPOLIA || id === CHAIN_IDS.ZKSYNC_MAINNET) return true;
  if (!isZkSyncBlockchainName(name)) return false;
  return !networkName || !networkName.includes("MAINNET");
}

export function isMantleChain(chainId?: string, blockchainName?: string): boolean {
  const stored = readStorage();
  const id = chainId ?? stored.chainId;
  const name = (blockchainName ?? stored.blockchainName).toUpperCase();
  if (id === CHAIN_IDS.MANTLE_MAINNET || id === CHAIN_IDS.MANTLE_TESTNET || id === CHAIN_IDS.MANTLE_SEPOLIA) {
    return true;
  }
  return isMantleBlockchainName(name);
}

export function isBlastChain(chainId?: string, blockchainName?: string): boolean {
  const stored = readStorage();
  const id = chainId ?? stored.chainId;
  const name = (blockchainName ?? stored.blockchainName).toUpperCase();
  if (id === CHAIN_IDS.BLAST_MAINNET || id === CHAIN_IDS.BLAST_SEPOLIA) return true;
  return isBlastBlockchainName(name);
}

export function isCeloChain(chainId?: string, blockchainName?: string): boolean {
  const stored = readStorage();
  const id = chainId ?? stored.chainId;
  const name = (blockchainName ?? stored.blockchainName).toUpperCase();
  if (
    id === CHAIN_IDS.CELO_MAINNET ||
    id === CHAIN_IDS.CELO_ALFAJORES ||
    id === CHAIN_IDS.CELO_SEPOLIA
  ) {
    return true;
  }
  return isCeloBlockchainName(name);
}

export function isPalmChain(chainId?: string, blockchainName?: string): boolean {
  const stored = readStorage();
  const id = chainId ?? stored.chainId;
  const name = (blockchainName ?? stored.blockchainName).toUpperCase();
  if (id === CHAIN_IDS.PALM_MAINNET || id === CHAIN_IDS.PALM_TESTNET) return true;
  return isPalmBlockchainName(name);
}

export function isLineaChain(chainId?: string, blockchainName?: string): boolean {
  const stored = readStorage();
  const id = chainId ?? stored.chainId;
  const name = (blockchainName ?? stored.blockchainName).toUpperCase();
  if (id === CHAIN_IDS.LINEA_MAINNET || id === CHAIN_IDS.LINEA_SEPOLIA) return true;
  return isLineaBlockchainName(name);
}

function resolveByBlockchainName(id: string, name: string, networkName: string): ChainConfig | null {
  if (isEthChain(id, name)) {
    return CHAIN_REGISTRY[id === CHAIN_IDS.ETH_MAINNET ? CHAIN_IDS.ETH_MAINNET : CHAIN_IDS.ETH_SEPOLIA];
  }
  if (isPolygonChain(id, name)) return CHAIN_REGISTRY[CHAIN_IDS.POLYGON_AMOY];
  if (isScrollChain(id, name)) {
    return CHAIN_REGISTRY[isMainnetNetwork(networkName) ? CHAIN_IDS.SCROLL_MAINNET : CHAIN_IDS.SCROLL_SEPOLIA];
  }
  if (isZkSyncChain(id, name)) {
    return CHAIN_REGISTRY[isMainnetNetwork(networkName) ? CHAIN_IDS.ZKSYNC_MAINNET : CHAIN_IDS.ZKSYNC_SEPOLIA];
  }
  if (isMantleChain(id, name)) {
    if (id && CHAIN_REGISTRY[id]) return CHAIN_REGISTRY[id];
    if (networkName.includes("SEPOLIA")) return CHAIN_REGISTRY[CHAIN_IDS.MANTLE_SEPOLIA];
    if (isMainnetNetwork(networkName)) return CHAIN_REGISTRY[CHAIN_IDS.MANTLE_MAINNET];
    return CHAIN_REGISTRY[CHAIN_IDS.MANTLE_TESTNET];
  }
  if (isBlastChain(id, name)) {
    return CHAIN_REGISTRY[isMainnetNetwork(networkName) ? CHAIN_IDS.BLAST_MAINNET : CHAIN_IDS.BLAST_SEPOLIA];
  }
  if (isCeloChain(id, name)) {
    if (id && CHAIN_REGISTRY[id]) return CHAIN_REGISTRY[id];
    if (networkName.includes("ALFAJORES")) return CHAIN_REGISTRY[CHAIN_IDS.CELO_ALFAJORES];
    if (isMainnetNetwork(networkName)) return CHAIN_REGISTRY[CHAIN_IDS.CELO_MAINNET];
    return CHAIN_REGISTRY[CHAIN_IDS.CELO_SEPOLIA];
  }
  if (isPalmChain(id, name)) {
    return CHAIN_REGISTRY[isMainnetNetwork(networkName) ? CHAIN_IDS.PALM_MAINNET : CHAIN_IDS.PALM_TESTNET];
  }
  if (isLineaChain(id, name)) {
    return CHAIN_REGISTRY[isMainnetNetwork(networkName) ? CHAIN_IDS.LINEA_MAINNET : CHAIN_IDS.LINEA_SEPOLIA];
  }
  if (isArbitrumBlockchainName(name)) {
    return CHAIN_REGISTRY[isMainnetNetwork(networkName) ? CHAIN_IDS.ARBITRUM_MAINNET : CHAIN_IDS.ARBITRUM_SEPOLIA];
  }
  if (isOptimismBlockchainName(name)) {
    return CHAIN_REGISTRY[isMainnetNetwork(networkName) ? CHAIN_IDS.OPTIMISM_MAINNET : CHAIN_IDS.OPTIMISM_SEPOLIA];
  }
  if (isAvalancheBlockchainName(name)) {
    return CHAIN_REGISTRY[isMainnetNetwork(networkName) ? CHAIN_IDS.AVALANCHE_MAINNET : CHAIN_IDS.AVALANCHE_FUJI];
  }
  if (isBscBlockchainName(name)) {
    return CHAIN_REGISTRY[isMainnetNetwork(networkName) ? CHAIN_IDS.BSC_MAINNET : CHAIN_IDS.BSC_TESTNET];
  }
  if (name === "BASE") {
    return CHAIN_REGISTRY[isMainnetNetwork(networkName) ? CHAIN_IDS.BASE_MAINNET : CHAIN_IDS.BASE_SEPOLIA];
  }
  return null;
}

export function getChainConfig(chainId?: string, blockchainName?: string): ChainConfig {
  const stored = readStorage();
  const id = chainId ?? stored.chainId;
  const name = (blockchainName ?? stored.blockchainName).toUpperCase();
  const networkName = stored.networkName;

  if (id && CHAIN_REGISTRY[id]) {
    return CHAIN_REGISTRY[id];
  }

  const byName = resolveByBlockchainName(id, name, networkName);
  if (byName) return byName;

  if (id) {
    return usdcAlpha({
      chainId: id,
      displayName: name || `Chain ${id}`,
    });
  }

  return CHAIN_REGISTRY[CHAIN_IDS.BASE_SEPOLIA];
}

const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/** Prefer widget-provided nativeToken when it is a valid address. */
export function resolveTokenAddress(chainId?: string, blockchainName?: string): string {
  const config = getChainConfig(chainId, blockchainName);
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("nativeToken")?.trim();
    if (stored && ETH_ADDRESS_RE.test(stored)) {
      return stored;
    }
  }
  return config.tokenAddress;
}

/** ERC20 contracts to include in activity/history (registry + widget native token). */
export function getTrackedTokenAddresses(chainId?: string, blockchainName?: string): string[] {
  const config = getChainConfig(chainId, blockchainName);
  const resolved = resolveTokenAddress(chainId, blockchainName);
  const seen = new Set<string>();
  const addresses: string[] = [];

  for (const addr of [config.tokenAddress, resolved]) {
    const normalized = addr?.trim().toLowerCase();
    if (!normalized || !ETH_ADDRESS_RE.test(addr.trim()) || seen.has(normalized)) continue;
    seen.add(normalized);
    addresses.push(addr.trim());
  }

  return addresses;
}

/** Display label for a tracked token contract address. */
export function getTokenLabelForAddress(
  tokenAddress: string,
  chainId?: string,
  blockchainName?: string
): string {
  const config = getChainConfig(chainId, blockchainName);
  const resolved = resolveTokenAddress(chainId, blockchainName);
  if (tokenAddress.trim().toLowerCase() === resolved.trim().toLowerCase()) {
    return config.tokenLabel;
  }
  if (tokenAddress.trim().toLowerCase() === config.tokenAddress.trim().toLowerCase()) {
    return config.tokenLabel;
  }
  return config.tokenLabel;
}

export function getTokenLabel(chainId?: string, blockchainName?: string): string {
  return getChainConfig(chainId, blockchainName).tokenLabel;
}

export function getConnectedNetworkDisplay(): {
  name: string;
  isBase: boolean;
  isPolygon?: boolean;
} {
  const config = getChainConfig();
  return {
    name: config.displayName,
    isBase: config.isBase,
    isPolygon: config.isPolygon,
  };
}

export function getAlchemyNetwork(chainId?: string, blockchainName?: string): AlchemyNetwork | undefined {
  return getChainConfig(chainId, blockchainName).alchemyNetwork;
}

export const TOKEN_ADDRESSES: Record<string, string> = Object.fromEntries(
  Object.entries(CHAIN_REGISTRY).map(([chainId, entry]) => [chainId, entry.tokenAddress]),
);

export const CHAIN_TO_ALCHEMY_NETWORK: Record<string, AlchemyNetwork> = Object.fromEntries(
  Object.entries(CHAIN_REGISTRY)
    .filter(([, entry]) => entry.alchemyNetwork)
    .map(([chainId, entry]) => [chainId, entry.alchemyNetwork as AlchemyNetwork]),
);

/** Block explorer URL for a transaction hash on the connected chain. */
export function getTxExplorerUrl(txHash: string, chainId?: string, blockchainName?: string): string {
  const id = chainId ?? (typeof window !== "undefined" ? localStorage.getItem("chainIdConfig") || "" : "");
  const chain = (blockchainName ?? (typeof window !== "undefined" ? localStorage.getItem("blockchainName") : "") ?? "BASE").toUpperCase();

  if (chain === "ETH" || id === CHAIN_IDS.ETH_MAINNET || id === CHAIN_IDS.ETH_SEPOLIA) {
    return id === CHAIN_IDS.ETH_MAINNET
      ? `https://etherscan.io/tx/${txHash}`
      : `https://sepolia.etherscan.io/tx/${txHash}`;
  }
  if (isPolygonChain(id, chain)) {
    return `https://amoy.polygonscan.com/tx/${txHash}`;
  }
  if (isScrollChain(id, chain)) {
    return id === CHAIN_IDS.SCROLL_MAINNET
      ? `https://scrollscan.com/tx/${txHash}`
      : `https://sepolia.scrollscan.com/tx/${txHash}`;
  }
  if (isZkSyncChain(id, chain)) {
    return id === CHAIN_IDS.ZKSYNC_MAINNET
      ? `https://explorer.zksync.io/tx/${txHash}`
      : `https://sepolia.explorer.zksync.io/tx/${txHash}`;
  }
  if (isMantleChain(id, chain)) {
    return id === CHAIN_IDS.MANTLE_MAINNET
      ? `https://mantlescan.xyz/tx/${txHash}`
      : `https://explorer.sepolia.mantle.xyz/tx/${txHash}`;
  }
  if (isBlastChain(id, chain)) {
    return id === CHAIN_IDS.BLAST_MAINNET
      ? `https://blastscan.io/tx/${txHash}`
      : `https://testnet.blastscan.io/tx/${txHash}`;
  }
  if (isCeloChain(id, chain)) {
    if (id === CHAIN_IDS.CELO_MAINNET) return `https://celoscan.io/tx/${txHash}`;
    if (id === CHAIN_IDS.CELO_ALFAJORES) return `https://alfajores.celoscan.io/tx/${txHash}`;
    return `https://celo-sepolia.blockscout.com/tx/${txHash}`;
  }
  if (isPalmChain(id, chain)) {
    return id === CHAIN_IDS.PALM_MAINNET
      ? `https://palm.chainlens.com/transactions/${txHash}`
      : `https://testnet.palm.chainlens.com/transactions/${txHash}`;
  }
  if (isLineaChain(id, chain)) {
    return id === CHAIN_IDS.LINEA_MAINNET
      ? `https://lineascan.build/tx/${txHash}`
      : `https://sepolia.lineascan.build/tx/${txHash}`;
  }
  if (id === CHAIN_IDS.ARBITRUM_MAINNET) return `https://arbiscan.io/tx/${txHash}`;
  if (id === CHAIN_IDS.ARBITRUM_SEPOLIA) return `https://sepolia.arbiscan.io/tx/${txHash}`;
  if (id === CHAIN_IDS.OPTIMISM_MAINNET) return `https://optimistic.etherscan.io/tx/${txHash}`;
  if (id === CHAIN_IDS.OPTIMISM_SEPOLIA) return `https://sepolia-optimism.etherscan.io/tx/${txHash}`;
  if (id === CHAIN_IDS.AVALANCHE_MAINNET) return `https://snowtrace.io/tx/${txHash}`;
  if (id === CHAIN_IDS.AVALANCHE_FUJI) return `https://testnet.snowtrace.io/tx/${txHash}`;
  if (id === CHAIN_IDS.BSC_MAINNET) return `https://bscscan.com/tx/${txHash}`;
  if (id === CHAIN_IDS.BSC_TESTNET) return `https://testnet.bscscan.com/tx/${txHash}`;
  if (id === CHAIN_IDS.BASE_MAINNET) {
    return `https://basescan.org/tx/${txHash}`;
  }
  return `https://sepolia.basescan.org/tx/${txHash}`;
}

/** All deployed Kalp ERC20Facilitator contracts support on-chain platform fee (TransferWithFee + feeRecipient). */
export function supportsOnChainPlatformFee(_chainId?: string, _blockchainName?: string): boolean {
  return true;
}
