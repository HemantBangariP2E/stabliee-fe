import { Card } from "@/components/ui/card";
import { useAlchemyTransactions } from "@/hooks/useAlchemyTransactions";
import type { AlchemyNetwork } from "@/lib/alchemy";

/** Token addresses per network (matches Transactions.tsx) */
const TOKEN_ADDRESSES: Record<string, string> = {
  "11155111": "0x5aEC77A2CBE8ee9D359F965826BdDFa026DfFb38", // ETH Sepolia USDT
  "1": "0xfE9F09aa5b416b5A83bD9387A99Fc7b1185e3D2A", // ETH Mainnet
  "84532": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Sepolia USDC
  "8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet
};

const CHAIN_TO_NETWORK: Record<string, AlchemyNetwork> = {
  "11155111": "eth-sepolia",
  "1": "eth-mainnet",
  "84532": "base-sepolia",
  "8453": "base-mainnet",
};

/**
 * Example usage of useAlchemyTransactions.
 * Displays on-chain ERC20 sent/received totals from Kalp Wallet API.
 */
export function AlchemyTotalsCard() {
  const ownerAddress = typeof window !== "undefined" ? localStorage.getItem("ownerAddress") : null;
  const chainId = typeof window !== "undefined" ? localStorage.getItem("chainIdConfig") || "84532" : "84532";
  const tokenAddress = TOKEN_ADDRESSES[chainId] ?? TOKEN_ADDRESSES["84532"];
  const network = CHAIN_TO_NETWORK[chainId];

  const { sent, received, loading, error } = useAlchemyTransactions(
    ownerAddress,
    tokenAddress,
    { network: network ?? "base-sepolia", enabled: !!ownerAddress && !!network }
  );

  if (!ownerAddress || !network) return null;

  return (
    <Card className="p-4 rounded-xl border border-border bg-muted/20">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        On-chain totals (Kalp)
      </p>
      {loading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {!loading && !error && (
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Sent: </span>
            <span className="font-medium">{sent.toFixed(6)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Received: </span>
            <span className="font-medium text-success">{received.toFixed(6)}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
