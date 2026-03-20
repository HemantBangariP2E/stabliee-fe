import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns the connected network name and type based on chainId/blockchainName. */
export function getConnectedNetworkDisplay(): { name: string; isBase: boolean } {
  if (typeof window === "undefined") return { name: "Base", isBase: true };
  const chainId = localStorage.getItem("chainIdConfig") || "";
  const blockchainName = (localStorage.getItem("blockchainName") || "BASE").toUpperCase();
  if (blockchainName === "ETH" || chainId === "11155111" || chainId === "1") {
    return {
      name: chainId === "1" ? "Ethereum" : "Ethereum (Sepolia)",
      isBase: false,
    };
  }
  return {
    name: chainId === "84532" ? "Base Sepolia" : "Base",
    isBase: true,
  };
}
