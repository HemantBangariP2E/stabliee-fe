import type { AlchemyNetwork } from "@/lib/alchemy";

export const CHAIN_IDS = {
  ETH_MAINNET: "1",
  ETH_SEPOLIA: "11155111",
  BASE_MAINNET: "8453",
  BASE_SEPOLIA: "84532",
  POLYGON_AMOY: "80002",
  SCROLL_SEPOLIA: "534351",
} as const;

export const POLYGON_AMOY_TOKEN = "0x5BC94481A667b90e5BA31411536f3aCB804FAA57";
export const SCROLL_SEPOLIA_TOKEN = "0xde987ff60a72d14e3c2cdb6975c8c60c3d299da2";

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

function isPolygonBlockchainName(name: string): boolean {
  return name === "POLYGON" || name === "POLY" || name === "MATIC" || name === "POL";
}

function isScrollBlockchainName(name: string): boolean {
  return name === "SCROLL" || name === "SCRL";
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

  if (id === CHAIN_IDS.SCROLL_SEPOLIA) return true;
  if (!isScrollBlockchainName(name)) return false;
  return !networkName || !networkName.includes("MAINNET");
}

export function getChainConfig(chainId?: string, blockchainName?: string): ChainConfig {
  const { chainId: id, blockchainName: name } =
    chainId !== undefined && blockchainName !== undefined
      ? { chainId, blockchainName: blockchainName.toUpperCase() }
      : readStorage();

  if (isEthChain(id, name)) {
    if (id === CHAIN_IDS.ETH_MAINNET) {
      return {
        chainId: CHAIN_IDS.ETH_MAINNET,
        tokenAddress: "0x5aEC77A2CBE8ee9D359F965826BdDFa026DfFb38",
        currency: "USDT",
        tokenLabel: "USDT",
        displayName: "Ethereum",
        isBase: false,
        isPolygon: false,
      };
    }
    return {
      chainId: CHAIN_IDS.ETH_SEPOLIA,
      tokenAddress: "0x5aEC77A2CBE8ee9D359F965826BdDFa026DfFb38",
      currency: "USDT",
      tokenLabel: "USDT",
      displayName: "Ethereum (Sepolia)",
      alchemyNetwork: "eth-sepolia",
      isBase: false,
      isPolygon: false,
    };
  }

  if (isPolygonChain(id, name)) {
    return {
      chainId: CHAIN_IDS.POLYGON_AMOY,
      tokenAddress: POLYGON_AMOY_TOKEN,
      currency: "USDC",
      tokenLabel: "USDC",
      displayName: "Polygon Amoy",
      isBase: false,
      isPolygon: true,
    };
  }

  if (isScrollChain(id, name)) {
    return {
      chainId: CHAIN_IDS.SCROLL_SEPOLIA,
      tokenAddress: SCROLL_SEPOLIA_TOKEN,
      currency: "USDC",
      tokenLabel: "USDC",
      displayName: "Scroll Sepolia",
      isBase: false,
      isPolygon: false,
    };
  }

  if (id === CHAIN_IDS.BASE_SEPOLIA) {
    return {
      chainId: CHAIN_IDS.BASE_SEPOLIA,
      tokenAddress: "0x28bD35b56bfCa732C7DF2F2d08312169189605A8",
      currency: "USDC",
      tokenLabel: "USDC",
      displayName: "Base Sepolia",
      alchemyNetwork: "base-sepolia",
      isBase: true,
      isPolygon: false,
    };
  }

  return {
    chainId: id || CHAIN_IDS.BASE_MAINNET,
    tokenAddress: "0x28bD35b56bfCa732C7DF2F2d08312169189605A8",
    currency: "USDC",
    tokenLabel: "USDC",
    displayName: id === CHAIN_IDS.BASE_MAINNET ? "Base" : "Base",
    isBase: true,
    isPolygon: false,
  };
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

export const TOKEN_ADDRESSES: Record<string, string> = {
  [CHAIN_IDS.ETH_SEPOLIA]: "0x5aEC77A2CBE8ee9D359F965826BdDFa026DfFb38",
  [CHAIN_IDS.BASE_SEPOLIA]: "0x28bD35b56bfCa732C7DF2F2d08312169189605A8",
  [CHAIN_IDS.POLYGON_AMOY]: POLYGON_AMOY_TOKEN,
  [CHAIN_IDS.SCROLL_SEPOLIA]: SCROLL_SEPOLIA_TOKEN,
};

export const CHAIN_TO_ALCHEMY_NETWORK: Record<string, AlchemyNetwork> = {
  [CHAIN_IDS.ETH_SEPOLIA]: "eth-sepolia",
  [CHAIN_IDS.BASE_SEPOLIA]: "base-sepolia",
};

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
    return `https://sepolia.scrollscan.com/tx/${txHash}`;
  }
  if (id === CHAIN_IDS.BASE_MAINNET) {
    return `https://basescan.org/tx/${txHash}`;
  }
  return `https://sepolia.basescan.org/tx/${txHash}`;
}
