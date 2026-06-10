import { Card } from "@/components/ui/card";
import { useAlchemyTransactions } from "@/hooks/useAlchemyTransactions";
import { getAlchemyNetwork, getChainConfig } from "@/lib/chains";

/**
 * Example usage of useAlchemyTransactions.
 * Displays on-chain ERC20 sent/received totals from Alchemy.
 */
export function AlchemyTotalsCard() {
  const ownerAddress = typeof window !== "undefined" ? localStorage.getItem("ownerAddress") : null;
  const chainConfig = getChainConfig();
  const tokenAddress = chainConfig.tokenAddress;
  const network = getAlchemyNetwork();

  const { sent, received, loading, error } = useAlchemyTransactions(
    ownerAddress,
    tokenAddress,
    { network: network ?? "base-sepolia", enabled: !!ownerAddress && !!network }
  );

  if (!ownerAddress || !network) return null;

  return (
    <Card className="p-4 rounded-xl border border-border bg-muted/20">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        On-chain totals (Alchemy)
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
