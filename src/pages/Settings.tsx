import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wallet, Copy, Globe, CheckCircle2, Zap } from "lucide-react";
import { supabase } from "@/hooks/supabaseClient";
import { toast } from "@/hooks/use-toast";
import {
  SUPPORTED_CHAINS,
  MAINNET_CHAINS,
  TESTNET_CHAINS,
  type SupportedChain,
  setActiveChain,
  getActiveChain,
  getEnabledChains,
  setEnabledChains,
} from "@/lib/chains";

// ── helpers ──────────────────────────────────────────────────────────────────
function chainKey(c: SupportedChain) {
  return `${c.blockchain}::${c.network}::${c.chainId}`;
}

const Settings = () => {
  const [walletAddress, setWalletAddress] = useState("");

  // multi-select enabled chains
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(() => {
    const ids = getEnabledChains();
    if (ids.length === 0) return new Set();
    return new Set(
      SUPPORTED_CHAINS.filter((c) => ids.includes(c.chainId)).map(chainKey)
    );
  });

  // active (single) chain
  const [activeChain, setActiveChainState] = useState<SupportedChain | null>(
    () => getActiveChain()
  );

  // tab
  const [networkTab, setNetworkTab] = useState<"MAINNET" | "TESTNET">("MAINNET");

  // listen for external chain changes (e.g. from Kalp widget)
  useEffect(() => {
    const onChainChanged = () => setActiveChainState(getActiveChain());
    window.addEventListener("chainChanged", onChainChanged);
    window.addEventListener("storage", onChainChanged);
    return () => {
      window.removeEventListener("chainChanged", onChainChanged);
      window.removeEventListener("storage", onChainChanged);
    };
  }, []);

  // wallet address from Supabase / localStorage
  useEffect(() => {
    const run = async () => {
      const fromLs = localStorage.getItem("ownerAddress")?.trim() || "";
      const userId = localStorage.getItem("userIdentifier")?.trim() || "";
      if (fromLs) setWalletAddress(fromLs);
      if (!userId && !fromLs) { setWalletAddress(""); return; }

      let q = supabase.from("user_logins").select("owner_address");
      q = userId ? q.eq("user_identifier", userId) : q.eq("owner_address", fromLs);
      const { data, error } = await q.maybeSingle();
      if (!error && data?.owner_address) setWalletAddress(data.owner_address);
      else if (!fromLs) setWalletAddress("");
    };
    run();
  }, []);

  const copyAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      toast({ title: "Copied", description: "Wallet address copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  // toggle a chain in the enabled multi-select
  const toggleEnabled = useCallback((chain: SupportedChain) => {
    const key = chainKey(chain);
    setEnabledKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      // persist
      const ids = SUPPORTED_CHAINS
        .filter((c) => next.has(chainKey(c)))
        .map((c) => c.chainId);
      setEnabledChains(ids);
      return next;
    });
  }, []);

  // switch the active (single) chain
  const handleSetActive = useCallback((chain: SupportedChain) => {
    setActiveChain(chain);
    setActiveChainState(chain);
    toast({
      title: "Network switched",
      description: `Active network: ${chain.displayName} (${chain.network})`,
    });
  }, []);

  const tabChains = networkTab === "MAINNET" ? MAINNET_CHAINS : TESTNET_CHAINS;
  const enabledCount = enabledKeys.size;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Account &amp; wallet</h1>
          <p className="text-muted-foreground">
            Manage your wallet, active network, and enabled blockchains
          </p>
        </div>

        <div className="grid gap-6">
          {/* ── Receiver Details ─────────────────────────────────────────── */}
          <Card className="p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Receiver Details</h2>
                <p className="text-sm text-muted-foreground">Your connected MPC / receiving wallet</p>
              </div>
            </div>

            <div className="space-y-4 max-w-2xl">
              {/* Active network badge */}
              <div className="space-y-2">
                <Label className="text-sm">Active Network</Label>
                {activeChain ? (
                  <div className="flex items-center gap-3 h-11 px-3 rounded-xl bg-muted/50 border border-border">
                    {activeChain.logo && (
                      <img
                        src={activeChain.logo}
                        alt={activeChain.blockchain}
                        className="w-5 h-5 rounded-full object-contain"
                        onError={(e: any) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <span className="text-sm font-medium flex-1">{activeChain.displayName}</span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: activeChain.isMainnet ? "#e6f4ea" : "#fff3e0",
                        color: activeChain.isMainnet ? "#2e7d32" : "#e65100",
                      }}
                    >
                      {activeChain.network}
                    </span>
                    <span className="text-xs text-muted-foreground">ID: {activeChain.chainId}</span>
                  </div>
                ) : (
                  <Input readOnly value="—" className="h-11 rounded-xl bg-muted/50 text-sm" />
                )}
                <p className="text-xs text-muted-foreground">
                  Switch your active network below. Transactions use this chain.
                </p>
              </div>

              {/* Wallet address */}
              <div className="space-y-2">
                <Label className="text-sm">Receiver Wallet Address</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    placeholder="Sign in to see your wallet address"
                    value={walletAddress}
                    className="h-11 rounded-xl font-mono text-sm bg-muted/50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-xl"
                    onClick={copyAddress}
                    disabled={!walletAddress}
                    aria-label="Copy wallet address"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                {!walletAddress && (
                  <p className="text-xs text-muted-foreground">
                    No wallet found. Sign in from the login page so your address is stored, then open Settings again.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* ── Multi-chain / Network Selector ───────────────────────────── */}
          <Card className="p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Blockchain &amp; Network</h2>
                  <p className="text-sm text-muted-foreground">
                    Enable networks and set your active chain
                  </p>
                </div>
              </div>
              {enabledCount > 0 && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  {enabledCount} enabled
                </span>
              )}
            </div>

            {/* Mainnet / Testnet tab */}
            <div className="flex gap-1 p-1 rounded-xl bg-muted mb-4">
              {(["MAINNET", "TESTNET"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setNetworkTab(tab)}
                  className={`flex-1 py-1.5 rounded-[8px] text-sm font-medium transition-all ${
                    networkTab === tab
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "MAINNET" ? "Mainnet" : "Testnet"}
                </button>
              ))}
            </div>

            {/* Chain list */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {tabChains.map((chain) => {
                const key = chainKey(chain);
                const isEnabled = enabledKeys.has(key);
                const isActive =
                  activeChain?.blockchain === chain.blockchain &&
                  activeChain?.network === chain.network;

                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : isEnabled
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-background hover:bg-muted/40"
                    }`}
                  >
                    {/* Enabled checkbox */}
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleEnabled(chain)}
                      className="w-4 h-4 rounded cursor-pointer accent-primary"
                    />

                    {/* Logo */}
                    {chain.logo ? (
                      <img
                        src={chain.logo}
                        alt={chain.blockchain}
                        className="w-8 h-8 rounded-full object-contain flex-shrink-0"
                        onError={(e: any) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary">
                        {chain.blockchain.slice(0, 2)}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {chain.displayName}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
                            <Zap className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">Chain ID: {chain.chainId}</span>
                        <span className="text-xs text-muted-foreground">· {chain.currency}</span>
                      </div>
                    </div>

                    {/* Network badge */}
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: chain.isMainnet ? "#e6f4ea" : "#fff3e0",
                        color: chain.isMainnet ? "#2e7d32" : "#e65100",
                      }}
                    >
                      {chain.network}
                    </span>

                    {/* Set active button */}
                    <Button
                      type="button"
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      className="h-8 rounded-lg text-xs flex-shrink-0"
                      onClick={() => handleSetActive(chain)}
                      disabled={isActive}
                    >
                      {isActive ? (
                        <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active</>
                      ) : (
                        "Switch"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Enabled chips summary */}
            {enabledCount > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Enabled networks:</p>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_CHAINS.filter((c) => enabledKeys.has(chainKey(c))).map((c) => (
                    <span
                      key={chainKey(c)}
                      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary"
                    >
                      {c.displayName}
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: c.isMainnet ? "#e6f4ea" : "#fff3e0",
                          color: c.isMainnet ? "#2e7d32" : "#e65100",
                        }}
                      >
                        {c.network}
                      </span>
                      <button
                        type="button"
                        className="ml-0.5 opacity-60 hover:opacity-100"
                        onClick={() => toggleEnabled(c)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
