import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Send, Download, Users, Eye, EyeOff, Code, Copy, Mail, Plus, ArrowDownToLine, Building2, Smartphone } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import usdcLogo from "@/assets/usdc-logo.svg";
import eurcLogo from "@/assets/eurc-logo.svg";
import baseLogo from "@/assets/base-logo.png";
import { useEffect } from "react";
import { supabase } from "@/hooks/supabaseClient";
import { ethers } from "ethers";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const getEthSepoliaRpcUrl = (): string =>
  (import.meta.env.VITE_ETH_SEPOLIA_RPC as string) || "https://ethereum-sepolia-rpc.publicnode.com";

const getRpcUrlAndToken = (): { rpcUrl: string; tokenAddress: string } => {
  const chainId = localStorage.getItem("chainIdConfig");
  const blockchainName = (localStorage.getItem("blockchainName") || "BASE").toUpperCase();
  if (blockchainName === "ETH" || chainId === "11155111") {
    return {
      rpcUrl: getEthSepoliaRpcUrl(),
      // USDT on Sepolia: https://sepolia.etherscan.io/token/0x5aec77a2cbe8ee9d359f965826bddfa026dffb38
      tokenAddress: "0x5aEC77A2CBE8ee9D359F965826BdDFa026DfFb38",
    };
  }
  return {
    rpcUrl: chainId === "84532" ? "https://sepolia.base.org" : "https://mainnet.base.org",
    tokenAddress: "0x28bD35b56bfCa732C7DF2F2d08312169189605A8",
  };
};

const getTokenBalance = async (address: string): Promise<number> => {
  const { rpcUrl, tokenAddress } = getRpcUrlAndToken();
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const [balance, decimals] = await Promise.all([
    contract.balanceOf(address),
    contract.decimals(),
  ]);
  return Number(ethers.formatUnits(balance, decimals));
};

const chartData = [{
  date: "30 Nov",
  value: 0
}, {
  date: "01 Dec",
  value: 0.3
}, {
  date: "02 Dec",
  value: 0.8
}, {
  date: "03 Dec",
  value: 0.2
}, {
  date: "04 Dec",
  value: 0.1
}, {
  date: "05 Dec",
  value: 0
}, {
  date: "06 Dec",
  value: 0
}];
type MoneyAction = "add" | "withdraw";
type SelectedCoin = "USDC" | "EURC";
const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userIdentifier = localStorage.getItem("userIdentifier") || undefined;
  const ownerAddress = localStorage.getItem("ownerAddress") || undefined;

  const [totalSent, setTotalSent] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

  const userName = location.state?.name || "User";
  const [hideNumbers, setHideNumbers] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [moneyModalOpen, setMoneyModalOpen] = useState(false);
  const [moneyAction, setMoneyAction] = useState<MoneyAction>("add");
  const [selectedCoin, setSelectedCoin] = useState<SelectedCoin>("USDC");
  const email = "user@stabilee.com";
  const walletAddress = ownerAddress || "0x4c1a9cc6Cf1da9cc6Cf1daEDE3";

  useEffect(() => {
    if (!ownerAddress) {
      navigate("/login", { replace: true });
      return;
    }
  }, [ownerAddress, navigate]);

  useEffect(() => {
    if (!ownerAddress) return;
    let cancelled = false;
    (async () => {
      try {
        const balance = await getTokenBalance(ownerAddress);
        if (!cancelled) setUsdcBalance(balance);
      } catch (e) {
        console.error("Error fetching token balance:", e);
        if (!cancelled) setUsdcBalance(null);
      }
    })();
    return () => { cancelled = true; };
  }, [ownerAddress]);

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
      setTotalBalance(Number(data.balance || 0))
    }
  }

  fetchTotals()
}, [ownerAddress])
console.log({usdcBalance,totalBalance})
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
  {hideNumbers ? "••••••" : `$${(usdcBalance ? usdcBalance : 0).toFixed(2)}`}
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
              <p className="text-2xl font-bold text-foreground">{hideNumbers ? "••••••" : `$${(usdcBalance ? usdcBalance : 0).toFixed(2)}`}</p>
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
                {hideNumbers ? "••••••" : `$${totalSent.toFixed(2)}`}
                <span className="text-sm font-normal text-muted-foreground">Debited</span>
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
                {hideNumbers ? "••••••" : `$${totalReceived.toFixed(2)}`}
                <span className="text-sm font-normal text-muted-foreground">Credited</span>
              </p>
            </Card>
          </div>

          
        </div>

        {/* Currency Balances */}
        <Card id="currency-balances" className="p-4 md:p-6 rounded-2xl scroll-mt-24 md:scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 md:mb-6">Balances</h2>

          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="text-muted-foreground text-sm border-b border-border">
                  <th className="text-left font-medium pb-3">Currency</th>
                  <th className="text-right font-medium pb-3">Balance</th>
                  <th className="text-right font-medium pb-3">Value</th>
                  <th className="text-right font-medium pb-3"></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <img src={usdcLogo} alt="USDC" className="w-10 h-10" />
                      <div>
                        <p className="font-semibold text-foreground text-base">KC</p>
                        <p className="text-sm text-muted-foreground">KC Coin</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right font-bold text-foreground text-base">
                    {hideNumbers ? "••••••" : (usdcBalance ? usdcBalance : 0).toFixed(6)}
                  </td>
                  <td className="text-right font-bold text-foreground text-base">{hideNumbers ? "••••••" : `$${(usdcBalance ? usdcBalance : 0).toFixed(2)}`}</td>
                  
                </tr>
                <tr className="border-b border-border/50">
                  
                  
                  
                  
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {/* USDC Card */}
            <div className="border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={usdcLogo} alt="USDC" className="w-9 h-9" />
                  <div>
                    <p className="font-medium text-foreground">KC</p>
                    <p className="text-xs text-muted-foreground">KC Coin</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{hideNumbers ? "••••••" : `$${(usdcBalance ? usdcBalance : 0).toFixed(2)}`}</p>
                  <p className="text-xs text-muted-foreground">{hideNumbers ? "••••••" : (usdcBalance ? usdcBalance : 0).toFixed(6)} KC</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics Chart */}
        

        {/* Developer Notes */}
        

        {/* Receive Modal */}
        <Dialog open={receiveModalOpen} onOpenChange={setReceiveModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Receive KC</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              {/* Network Badge */}
              <div className="flex items-center gap-2 mb-4 px-3 py-1.5 bg-muted rounded-full">
                <img src={baseLogo} alt="Base" className="w-5 h-5 rounded-full" />
                <span className="text-sm font-medium">Base Network</span>
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
                Only send KC on Base network to this address
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