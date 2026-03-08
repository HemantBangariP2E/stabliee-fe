import { ethers } from "ethers";

const SEPOLIA_RPC = (import.meta.env.VITE_ETH_SEPOLIA_RPC as string) || "https://ethereum-sepolia-rpc.publicnode.com";
const USDT_SEPOLIA_ADDRESS = "0x5aec77a2cbe8ee9d359f965826bddfa026dffb38";

const ERC20_BALANCE_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
] as const;

/**
 * Fetches the USDT (ERC20) balance for a wallet on Sepolia.
 * @param address - Wallet address (e.g. 0x5840eaea8BE23091D01696a769a70f6fac86A2a1)
 * @returns Formatted balance string (human-readable, 18 decimals)
 */
export async function getTokenBalance(address: string): Promise<string> {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  const contract = new ethers.Contract(USDT_SEPOLIA_ADDRESS, ERC20_BALANCE_ABI, provider);
  const balance = await contract.balanceOf(address);
  return ethers.formatUnits(balance, 18);
}
