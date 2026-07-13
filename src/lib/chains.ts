import type { AlchemyNetwork } from "@/lib/alchemy";

export const CHAIN_IDS = {
  ETH_MAINNET: "1",
  ETH_SEPOLIA: "11155111",
  BASE_MAINNET: "8453",
  BASE_SEPOLIA: "84532",
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
} as const;

// export const ETH_USDT_TOKEN = "0x6df25D580C2354431C464f25aDee4e7a8c6c72c8";//usdt
export const ETH_USDT_TOKEN = "0x5aEC77A2CBE8ee9D359F965826BdDFa026DfFb38";//usdc 


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
  [CHAIN_IDS.POLYGON_AMOY]: {
    chainId: CHAIN_IDS.POLYGON_AMOY,
    tokenAddress: POLYGON_AMOY_TOKEN,
    currency: "USDC",
    tokenLabel: "USDC",
    displayName: "Polygon Amoy",
    isBase: false,
    isPolygon: true,
  },
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

export function getTokenAddressesForChain(chainId: string): {
  usdc: string | null;
  usdt: string | null;
} {
  const entry = CHAIN_REGISTRY[chainId];
  let usdc: string | null = ALPHA_USDC_TOKEN;
  let usdt: string | null = ETH_USDT_TOKEN;

  if (entry) {
    if (entry.currency === "USDC") {
      usdc = entry.tokenAddress;
    } else if (entry.currency === "USDT") {
      usdt = entry.tokenAddress;
    }
  }

  if (chainId === CHAIN_IDS.BASE_SEPOLIA || chainId === CHAIN_IDS.BASE_MAINNET) {
    usdc = BASE_USDC_TOKEN;
  }

  return { usdc, usdt };
}

export function getNativeCurrencySymbol(chainId: string, fallback = "ETH"): string {
  const entry = CHAIN_REGISTRY[chainId];
  if (entry?.displayName.toLowerCase().includes("polygon")) return "MATIC";
  if (entry?.displayName.toLowerCase().includes("avalanche")) return "AVAX";
  if (entry?.displayName.toLowerCase().includes("bsc")) return "BNB";
  return fallback;
}

export function getTokenLabel(chainId?: string, blockchainName?: string): string {
  return getChainConfig(chainId, blockchainName).tokenLabel;
}

export function getConnectedNetworkDisplay(
  chainId?: string,
  blockchainName?: string,
): {
  name: string;
  isBase: boolean;
  isPolygon?: boolean;
} {
  const config = getChainConfig(chainId, blockchainName);
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

/** CAIP-10 / EIP-155 format: eip155:chainId:address */
export function getQrAddressFormat(address: string, chainId: string): string {
  return address && chainId ? `eip155:${chainId}:${address}` : "";
}
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
