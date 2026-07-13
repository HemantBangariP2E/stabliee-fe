import { useEffect, useState } from "react";
import type { Chain } from "@kalp_studio/tresori-sdk-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTreSoriContext } from "@/context/TreSoriProvider";
import { fetchChainBalances, type ChainBalances } from "@/lib/chainBalances";
import { getActiveChainId } from "@/lib/walletSession";
import { ChainListInstance } from "@kalp_studio/tresori-sdk-js";

type Props = {
  walletAddress: string;
  hideNumbers?: boolean;
};

function formatAmount(value: number, hide: boolean, decimals = 6): string {
  if (hide) return "••••••";
  return value.toFixed(decimals);
}

export function BlockchainTabs({ walletAddress, hideNumbers = false }: Props) {
  const { chains, selectedChain, activateChain, tresori, initialized } = useTreSoriContext();
  const [balancesByChain, setBalancesByChain] = useState<Record<string, ChainBalances>>({});
  const [loadingChain, setLoadingChain] = useState<string | null>(null);

  const activeChainId = selectedChain?.chainId ?? getActiveChainId() ?? chains[0]?.chainId ?? "";

  useEffect(() => {
    if (!walletAddress || !activeChainId || !initialized) return;
    const chain = ChainListInstance.ofChainId(activeChainId);
    if (!chain) return;

    let cancelled = false;
    setLoadingChain(activeChainId);
    void fetchChainBalances(tresori, walletAddress, chain)
      .then((balances) => {
        if (!cancelled) {
          setBalancesByChain((prev) => ({ ...prev, [activeChainId]: balances }));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingChain(null);
      });
    return () => {
      cancelled = true;
    };
  }, [walletAddress, activeChainId, tresori, initialized]);

  const handleTabChange = (chainId: string) => {
    const chain = chains.find((c) => c.chainId === chainId);
    if (chain) activateChain(chain);
  };

  const balances = balancesByChain[activeChainId];
  const isLoading = loadingChain === activeChainId && !balances;

  if (chains.length === 0) {
    return (
      <Card className="p-6 rounded-2xl">
        <p className="text-sm text-muted-foreground">Loading enabled blockchains…</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6 rounded-2xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-foreground">Blockchains</h2>
        {selectedChain && (
          <Badge variant="default" className="rounded-full">
            Active: {selectedChain.blockchain} {selectedChain.network}
          </Badge>
        )}
      </div>

      <Tabs value={activeChainId} onValueChange={handleTabChange}>
        <TabsList className="flex flex-wrap h-auto gap-2 bg-muted/50 p-2 rounded-xl">
          {chains.map((chain: Chain) => (
            <TabsTrigger
              key={chain.id}
              value={chain.chainId}
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {chain.blockchain} · {chain.network}
            </TabsTrigger>
          ))}
        </TabsList>

        {chains.map((chain) => (
          <TabsContent key={chain.id} value={chain.chainId} className="mt-4">
            <p className="text-xs text-muted-foreground mb-4">
              Transfers use this chain only while it is selected.
            </p>
            {isLoading && chain.chainId === activeChainId ? (
              <p className="text-sm text-muted-foreground">Loading balances…</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <BalanceTile
                  label="Native"
                  symbol={balances?.nativeSymbol ?? chain.currency}
                  amount={formatAmount(balances?.native ?? 0, hideNumbers, 6)}
                />
                <BalanceTile
                  label="USDC"
                  symbol="USDC"
                  amount={formatAmount(balances?.usdc ?? 0, hideNumbers, 2)}
                />
                <BalanceTile
                  label="USDT"
                  symbol="USDT"
                  amount={formatAmount(balances?.usdt ?? 0, hideNumbers, 2)}
                />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}

function BalanceTile({
  label,
  symbol,
  amount,
}: {
  label: string;
  symbol: string;
  amount: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold text-foreground">{amount}</p>
      <p className="text-xs text-muted-foreground mt-1">{symbol}</p>
    </div>
  );
}
