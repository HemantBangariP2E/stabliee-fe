import type { Chain } from "@kalp_studio/tresori-sdk-js";
import { resolveTokenAddress } from "@/lib/chains";

export type MpcSession = {
  email: string;
  walletAddress: string;
  clientShare: string;
  sessionId: string;
  chain: Chain;
};

const SESSION_KEYS = {
  userIdentifier: "userIdentifier",
  ownerAddress: "ownerAddress",
  userShard: "userShard",
  sessionId: "sessionId",
  chainIdConfig: "chainIdConfig",
  blockchainName: "blockchainName",
  networkName: "networkName",
  walletProvider: "walletProvider",
  nativeToken: "nativeToken",
} as const;

export function persistMpcSession({
  email,
  walletAddress,
  clientShare,
  sessionId,
  chain,
}: MpcSession): void {
  localStorage.setItem(SESSION_KEYS.userIdentifier, email);
  localStorage.setItem(SESSION_KEYS.ownerAddress, walletAddress);
  localStorage.setItem(SESSION_KEYS.userShard, clientShare);
  localStorage.setItem(SESSION_KEYS.sessionId, sessionId);
  localStorage.setItem(SESSION_KEYS.chainIdConfig, chain.chainId);
  localStorage.setItem(SESSION_KEYS.blockchainName, chain.blockchain);
  localStorage.setItem(SESSION_KEYS.networkName, chain.network);
  localStorage.setItem(SESSION_KEYS.walletProvider, "mpc");
  localStorage.setItem(SESSION_KEYS.nativeToken, resolveTokenAddress());
}

export function getMpcSession(): MpcSession | null {
  const email = localStorage.getItem(SESSION_KEYS.userIdentifier)?.trim() ?? "";
  const walletAddress = localStorage.getItem(SESSION_KEYS.ownerAddress)?.trim() ?? "";
  const clientShare = localStorage.getItem(SESSION_KEYS.userShard)?.trim() ?? "";
  const sessionId = localStorage.getItem(SESSION_KEYS.sessionId)?.trim() ?? "";
  const chainId = localStorage.getItem(SESSION_KEYS.chainIdConfig)?.trim() ?? "";

  if (!email || !walletAddress || !clientShare || !sessionId || !chainId) {
    return null;
  }

  return {
    email,
    walletAddress,
    clientShare,
    sessionId,
    chain: {
      id: 0,
      blockchain: localStorage.getItem(SESSION_KEYS.blockchainName) ?? "",
      network: localStorage.getItem(SESSION_KEYS.networkName) ?? "",
      chainId,
      explorerUrl: "",
      currency: "",
      logo: "",
      createdAt: "",
    },
  };
}

export function isAuthenticated(): boolean {
  return getMpcSession() !== null;
}

export function clearMpcSession(): void {
  for (const key of Object.values(SESSION_KEYS)) {
    localStorage.removeItem(key);
  }
}
