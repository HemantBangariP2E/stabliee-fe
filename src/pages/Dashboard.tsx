import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Send, Download, Eye, EyeOff, Copy, Mail, Building2, Smartphone, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import baseLogo from "@/assets/base-logo.png";
import { supabase } from "@/hooks/supabaseClient";
import { useAlchemyTransactions } from "@/hooks/useAlchemyTransactions";
import { getAlchemyNetwork, getChainConfig, getConnectedNetworkDisplay, getTokenLabel, setActiveChain, getActiveChain, SUPPORTED_CHAINS } from "@/lib/chains";
import { fetchTokenBalance, fetchTokenBalanceForChain } from "@/lib/tokenBalance";
import { useEnabledChains } from "@/hooks/useEnabledChains";
import type { ChainEntry } from "@/lib/walletApi";

type MoneyAction = "add" | "withdraw";
type SelectedCoin = "USDC" | "EURC";

// ── chain-key helper (no arrow-function import clash) ──────────────────────
function chainTabKey(c: ChainEntry) {
  return `${c.blockchain}::${c.network}::${c.chainId}`;
}

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userIdentifier = localStorage.getItem("userIdentifier") || undefined;
  const ownerAddress = localStorage.getItem("ownerAddress") || undefined;

  const [totalSent, setTotalSent] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [hideNumbers, setHideNumbers] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [moneyModalOpen, setMoneyModalOpen] = useState(false);
  const [moneyAction, setMoneyAction] = useState<MoneyAction>("add");
  const [selectedCoin, setSelectedCoin] = useState<SelectedCoin>("USDC");
  const email = localStorage.getItem("userIdentifier") || "user@stabilee.com";
  const walletAddress = ownerAddress || "";

  // ── multi-chain state ─────────────────────────────────────────────────────
  const { chains, mainnetChains, testnetChains, loading: chainsLoading } = useEnabledChains();
  const [networkTab, setNetworkTab] = useState<"MAINNET" | "TESTNET">("MAINNET");

  // Active chain — reads localStorage, reacts to chainChanged events
  const [activeChainEntry, setActiveChainEntry] = useState<ChainEntry | null>(() => {
    const ac = getActiveChain();
    if (!ac) return null;
    // try to find in chains cache (may be empty on first render)
    return null;
  });

  // Sync activeChainEntry once chains are loaded
  useEffect(() => {
    if (!chains.length) return;
    const ac = getActiveChain();
    if (ac) {
      const found = chains.find(
        (c) => c.chainId === ac.chainId && c.network === ac.network
      );
      setActiveChainEntry(found ?? chains[0]);
    } else {
      setActiveChainEntry(chains[0]);
    }
  }, [chains]);

  // Per-chain balance map: key → number | null | "loading"
  const [balanceMap, setBalanceMap] = useState<Record<string, number | null | "loading">>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  const fetchBalanceForChain = useCallback(async (chain: ChainEntry) => {
    if (!ownerAddress) return;
    const key = chainTabKey(chain);
    if (fetchedRef.current.has(key)) return;
    fetchedRef.current.add(key);
    // Mark as loading immediately so the render never sees undefined
    setBalanceMap((prev) => ({ ...prev, [key]: "loading" }));
    try {
      const bal = await fetchTokenBalanceForChain(ownerAddress, chain);
      setBalanceMap((prev) => ({ ...prev, [key]: typeof bal === "number" ? bal : null }));
    } catch {
      setBalanceMap((prev) => ({ ...prev, [key]: null }));
    }
  }, [ownerAddress]);

  // Fetch balance when chains load or tab switches
  useEffect(() => {
    const tabChains = networkTab === "MAINNET" ? mainnetChains : testnetChains;
    tabChains.forEach((c) => fetchBalanceForChain(c));
  }, [networkTab, mainnetChains, testnetChains, fetchBalanceForChain]);

  // Also fetch for active chain immediately
  useEffect(() => {
    if (activeChainEntry) fetchBalanceForChain(activeChainEntry);
  }, [activeChainEntry, fetchBalanceForChain]);

  const handleSwitchActiveChain = useCallback((chain: ChainEntry) => {
    // Match to SUPPORTED_CHAINS for setActiveChain helper
    const sc = SUPPORTED_CHAINS.find(
      (s) => s.chainId === chain.chainId && s.network === chain.network
    ) ?? {
      chainId: chain.chainId,
      blockchain: chain.blockchain,
      network: chain.network,
      displayName: `${chain.blockchain} ${chain.network}`,
      currency: chain.currency,
      explorerUrl: chain.explorerUrl,
      logo: chain.logo,
      isMainnet: chain.network.toUpperCase().includes("MAIN"),
    };
    setActiveChain(sc);
    setActiveChainEntry(chain);
    toast({ title: "Network switched", description: `Active: ${sc.displayName}` });
  }, []);

  const handleRefreshBalance = useCallback((chain: ChainEntry) => {
    const key = chainTabKey(chain);
    fetchedRef.current.delete(key);
    fetchBalanceForChain(chain);
  }, [fetchBalanceForChain]);

  // ── active chain for legacy balance display ────────────────────────────────
  const connectedTokenLabel = getTokenLabel();
  const connectedNetwork = getConnectedNetworkDisplay();

  const chainKey =
    typeof window !== "undefined"
      ? `${localStorage.getItem("chainIdConfig") ?? ""}_${localStorage.getItem("blockchainName") ?? ""}`
      : "";

  const chainConfig = getChainConfig();
  const tokenAddress = chainConfig.tokenAddress;
  const alchemyNetwork = getAlchemyNetwork();

  const { sent: alchemySent, received: alchemyReceived, loading: alchemyLoading } = useAlchemyTransactions(
    ownerAddress,
    tokenAddress,
    { network: alchemyNetwork ?? "base-sepolia", enabled: !!ownerAddress && !!alchemyNetwork }
  );

  const displaySent = alchemyNetwork ? alchemySent : totalSent;
  const displayReceived = alchemyNetwork ? alchemyReceived : totalReceived;

  // Active chain balance (for header card)
  const activeBalance = activeChainEntry
    ? balanceMap[chainTabKey(activeChainEntry)]
    : null;

  const toggleHideNumbers = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHideNumbers(!hideNumbers);
  };
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`
    });
  };
  const handleMoneyAction = (action: MoneyAction, coin: SelectedCoin) => {
    setMoneyAction(action);
    setSelectedCoin(coin);
    setMoneyModalOpen(true);
  };
  const handleMethodSelect = (method: "crypto" | "bank" | "mobile") => {
    setMoneyModalOpen(false);
    if (method === "crypto") {
      if (moneyAction === "add") {
        // Add money via crypto wallet -> go to receive page
        navigate(`/receive?coin=${selectedCoin}`);
      } else {
        // Withdraw to crypto wallet -> go to withdraw page
        navigate(`/withdraw?coin=${selectedCoin}`);
      }
    } else {
      // Bank or Mobile -> Add Money = Buy, Withdraw Money = Sell
      const buySellAction = moneyAction === "add" ? "buy" : "sell";
      navigate(`/buy-sell?coin=${selectedCoin}&action=${buySellAction}&method=${method}`);
    }
  };

  //   useEffect(() => {
  //     console.log("User Identifier:", userIdentifier);
  //   const saveUser = async () => {
  //     if (!userIdentifier || !ownerAddress) return;

  //     const { error } = await supabase
  //       .from("user_logins")
  //       .upsert(
  //         {
  //           user_identifier: userIdentifier,
  //           owner_address: ownerAddress,
  //         },
  //         { onConflict: "user_identifier" }
  //       );

  //     if (error) {
  //       console.error("Error saving user to Supabase:", error.message);
  //     }
  //   };

  //   saveUser();
  // }, [userIdentifier, ownerAddress]);

  useEffect(() => {
  console.log("User Identifier:", userIdentifier);

  const saveUser = async () => {
    if (!userIdentifier || !ownerAddress) return;

    // 1️⃣ Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("user_logins")
      .select("user_identifier")
      .eq("user_identifier", userIdentifier)
      .maybeSingle();

    if (fetchError) {
      console.error("Error checking user:", fetchError.message);
      return;
    }

    // 2️⃣ If exists → do nothing
    if (existingUser) {
      console.log("User already exists, skipping insert");
      return;
    }

    // 3️⃣ Insert only if not exists
    const { error: insertError } = await supabase.from("user_logins").insert({
      user_identifier: userIdentifier,
      owner_address: ownerAddress,
    });

    if (insertError) {
      console.error("Error saving user to Supabase:", insertError.message);
    } else {
      console.log("User inserted successfully");
    }
  };

  saveUser();
}, [userIdentifier, ownerAddress]);

  useEffect(() => {
  if (!ownerAddress) return

  const fetchTotals = async () => {
    const { data, error } = await supabase
      .from("wallet_summary")
      .select("*")
      .eq("owner_address", ownerAddress)
      .single()

    if (error) {
      console.error("Error fetching wallet summary:", error.message)
      return
    }

    if (data) {
      setTotalSent(Number(data.total_sent || 0))
      setTotalReceived(Number(data.total_received || 0))
    }
  }

  fetchTotals()
}, [ownerAddress])
  return <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mobile Wallet Card with Quick Actions */}
          <div className="md:hidden">
            <Card className="stat-card p-5 bg-gradient-to-br from-primary/5 via-card to-primary/10 border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shadow-sm">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm font-medium">Total Balance</span>
                   <p className="text-2xl font-bold text-foreground">
  {hideNumbers ? "••••••" : activeBalance === "loading" ? "…" : `${(typeof activeBalance === "number" ? activeBalance : 0).toFixed(4)} ${activeChainEntry?.currency ?? connectedTokenLabel}`}
</p>
                  </div>
                </div>
                <button onClick={toggleHideNumbers} className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  {hideNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Quick Actions inside card */}
              <div className="flex items-center justify-around pt-4 border-t border-border/50">
                <Link to="/transactions" className="flex flex-col items-center gap-1.5 group">
                  <div className="w-11 h-11 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-all group-hover:scale-105">
                    <Send className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                    Send
                  </span>
                </Link>
                <Link to="/receive" className="flex flex-col items-center gap-1.5 group">
                  <div className="w-11 h-11 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-all group-hover:scale-105">
                    <Download className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                    Receive
                  </span>
                </Link>
              </div>
            </Card>
          </div>

          {/* Desktop Wallet Card */}
          <div onClick={() => document.getElementById("currency-balances")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        })} className="hidden md:block cursor-pointer">
            <Card className="stat-card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground font-medium">Wallet</span>
                </div>
                <button onClick={toggleHideNumbers} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  {hideNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-2xl font-bold text-foreground">{hideNumbers ? "••••••" : activeBalance === "loading" ? "…" : `${(typeof activeBalance === "number" ? activeBalance : 0).toFixed(4)} ${activeChainEntry?.currency ?? connectedTokenLabel}`}</p>
            </Card>
          </div>

          <Link to="/transactions" className="hidden md:block">
            <Card className="stat-card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground font-medium">Send</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {hideNumbers ? "••••••" : alchemyLoading ? "..." : `$${displaySent.toFixed(2)}`}
                <span className="ml-2 text-sm font-normal text-muted-foreground">Debited</span>
              </p>
            </Card>
          </Link>

          <div onClick={() => setReceiveModalOpen(true)} className="hidden md:block cursor-pointer">
            <Card className="stat-card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <span className="text-muted-foreground font-medium">Receive</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {hideNumbers ? "••••••" : alchemyLoading ? "..." : `$${displayReceived.toFixed(2)}`}
                <span className="ml-2 text-sm font-normal text-muted-foreground">Credited</span>
              </p>
            </Card>
          </div>

          
        </div>

        {/* ── Multi-Chain Balances ─────────────────────────────────────────── */}
        <Card id="currency-balances" className="p-4 md:p-6 rounded-2xl scroll-mt-24 md:scroll-mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Balances by Network</h2>
            {activeChainEntry && (
              <div className="flex items-center gap-2">
                {activeChainEntry.logo && (
                  <img src={activeChainEntry.logo} alt={activeChainEntry.blockchain}
                    className="w-5 h-5 rounded-full object-contain"
                    onError={(e: any) => { e.target.style.display = "none"; }}
                  />
                )}
                <span className="text-sm font-medium text-foreground">{activeChainEntry.blockchain}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: activeChainEntry.network.toUpperCase().includes("MAIN") ? "#e6f4ea" : "#fff3e0",
                    color: activeChainEntry.network.toUpperCase().includes("MAIN") ? "#2e7d32" : "#e65100",
                  }}
                >
                  {activeChainEntry.network}
                </span>
                <span className="text-xs text-muted-foreground">active</span>
              </div>
            )}
          </div>

          {/* Mainnet / Testnet tab */}
          <div className="flex gap-1 p-1 rounded-xl bg-muted mb-4">
            {(["MAINNET", "TESTNET"] as const).map((tab) => (
              <button key={tab} type="button"
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

          {chainsLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              Loading chains…
            </div>
          ) : (networkTab === "MAINNET" ? mainnetChains : testnetChains).length === 0 ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              No {networkTab === "MAINNET" ? "mainnet" : "testnet"} chains available.
            </div>
          ) : (
            <div className="space-y-2">
              {(networkTab === "MAINNET" ? mainnetChains : testnetChains).map((chain) => {
                const key = chainTabKey(chain);
                const bal = balanceMap[key];
                const isActive =
                  activeChainEntry?.chainId === chain.chainId &&
                  activeChainEntry?.network === chain.network;

                return (
                  <div key={key}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    {/* Chain logo */}
                    {chain.logo ? (
                      <img src={chain.logo} alt={chain.blockchain}
                        className="w-9 h-9 rounded-full object-contain flex-shrink-0"
                        onError={(e: any) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-primary">
                        {chain.blockchain.slice(0, 2)}
                      </div>
                    )}

                    {/* Chain info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm truncate">
                          {chain.blockchain}
                        </span>
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            background: isActive ? "#e0dbff" : "#f1f1f4",
                            color: isActive ? "#4A3FC5" : "#666",
                          }}
                        >
                          {chain.network}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-semibold text-primary">● Active</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">Chain {chain.chainId} · {chain.currency}</span>
                    </div>

                    {/* Balance */}
                    <div className="text-right flex-shrink-0">
                      {bal === "loading" ? (
                        <span className="text-sm text-muted-foreground animate-pulse">…</span>
                      ) : typeof bal === "number" ? (
                        <span className="font-bold text-foreground text-sm">
                          {hideNumbers ? "••••" : `${bal.toFixed(4)} ${chain.currency}`}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>

                    {/* Refresh + Switch */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button type="button"
                        onClick={() => handleRefreshBalance(chain)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Refresh balance"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button type="button"
                        onClick={() => handleSwitchActiveChain(chain)}
                        disabled={isActive}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground cursor-default"
                            : "border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        }`}
                      >
                        {isActive ? "Active" : "Switch"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Statistics Chart */}
        

        {/* Developer Notes */}
        

        {/* Receive Modal */}
        <Dialog open={receiveModalOpen} onOpenChange={setReceiveModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Receive {connectedTokenLabel}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              {/* Network Badge */}
              <div className="flex items-center gap-2 mb-4 px-3 py-1.5 bg-muted rounded-full">
                {connectedNetwork.isBase ? (
                  <img src={baseLogo} alt="Base" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px] font-bold">
                    Ξ
                  </div>
                )}
                <span className="text-sm font-medium">{connectedNetwork.name}</span>
              </div>

              {/* QR Code */}
              <div className="p-4 bg-white rounded-2xl mb-6 shadow-sm">
                <QRCode value={walletAddress} size={180} level="M" fgColor="#000000" bgColor="#ffffff" />
              </div>

              {/* Address & Email Cards */}
              <div className="w-full max-w-xs grid grid-cols-2 gap-2">
                {/* Wallet Address */}
                <div className="bg-muted/50 border border-border rounded-lg px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="w-3 h-3 text-muted-foreground" />
                    <span className="font-mono text-xs text-foreground truncate max-w-[70px]">0x4c1a...EDE3</span>
                  </div>
                  <button onClick={() => copyToClipboard(walletAddress, "Address")} className="text-primary hover:text-primary/80 p-1 hover:bg-primary/10 rounded transition-colors flex-shrink-0">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Email */}
                <div className="bg-muted/50 border border-border rounded-lg px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-foreground truncate max-w-[70px]">{email.slice(0, 8)}...</span>
                  </div>
                  <button onClick={() => copyToClipboard(email, "Email")} className="text-primary hover:text-primary/80 p-1 hover:bg-primary/10 rounded transition-colors flex-shrink-0">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Info Note */}
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Only send {connectedTokenLabel} on {connectedNetwork.name} to this address
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add/Withdraw Money Modal */}
        <Dialog open={moneyModalOpen} onOpenChange={setMoneyModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                {moneyAction === "add" ? "Add Money" : "Withdraw Money"} - {selectedCoin}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground text-center mb-6">
                {moneyAction === "add" ? "Choose how you want to add money to your wallet" : "Choose how you want to withdraw your funds"}
              </p>
              
              <div className="space-y-3">
                {/* Crypto Wallet Option */}
                <button onClick={() => handleMethodSelect("crypto")} className="w-full flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Crypto Wallet</p>
                    <p className="text-sm text-muted-foreground">
                      {moneyAction === "add" ? "Receive from external wallet" : "Send to external wallet"}
                    </p>
                  </div>
                </button>

                {/* Bank Option */}
                <button onClick={() => handleMethodSelect("bank")} className="w-full flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Bank Transfer</p>
                    <p className="text-sm text-muted-foreground">
                      {moneyAction === "add" ? "Buy crypto via bank transfer" : "Withdraw to bank account"}
                    </p>
                  </div>
                </button>

                {/* Mobile Money Option */}
                <button onClick={() => handleMethodSelect("mobile")} className="w-full flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Smartphone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Mobile Money</p>
                    <p className="text-sm text-muted-foreground">
                      {moneyAction === "add" ? "Buy crypto via mobile money" : "Withdraw to mobile wallet"}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>;
};
export default Dashboard;