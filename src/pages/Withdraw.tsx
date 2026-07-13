import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import baseLogo from "@/assets/base-logo.png";
import { useActiveChain } from "@/hooks/useActiveChain";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Withdraw = () => {
  const navigate = useNavigate();
  const [recipientWallet, setRecipientWallet] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<"USDC" | "EURC">("USDC");
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  const balances = {
    USDC: 1250.00,
    EURC: 0.00
  };
  const availableBalance = balances[selectedCurrency];

  const currencies = [
    { id: "USDC", name: "USD Coin", symbol: "$", color: "#2775CA" }
  ] as const;

  const networkFee = 0.01;
  const serviceFee = 0.00;
  const { networkDisplay: connectedNetwork, networkLabel } = useActiveChain();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirmWithdraw = () => {
    if (!recipientWallet || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You cannot withdraw more than your available balance of ${availableBalance.toLocaleString()} ${selectedCurrency}`,
        variant: "destructive"
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const getTotalAmount = () => {
    const amountNum = parseFloat(amount) || 0;
    return (amountNum + networkFee + serviceFee).toFixed(2);
  };

  const handleFinalConfirm = () => {
    setShowConfirmDialog(false);
    toast({
      title: "Withdrawal Initiated",
      description: `Withdrawing ${amount} ${selectedCurrency} to ${recipientWallet.slice(0, 10)}...`
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Card className="p-6 rounded-2xl">
          <button 
            onClick={() => navigate('/dashboard')}
            className="mb-4 p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground mb-6">Withdraw {selectedCurrency}</h1>
          <div>
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2">External Wallet Address</p>
              <Input 
                placeholder="Enter wallet address (0x...)" 
                value={recipientWallet} 
                onChange={e => setRecipientWallet(e.target.value)}
                className="h-12 rounded-xl font-mono text-sm" 
              />
            </div>

            {/* Amount */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-foreground">Amount</Label>
              <div className="relative mt-2 flex">
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  className="h-12 rounded-xl rounded-r-none border-r-0 flex-1" 
                />
                <div className="h-12 px-4 rounded-xl rounded-l-none border border-border bg-muted/50 flex items-center gap-2">
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center" 
                    style={{ backgroundColor: "#2775CA" }}
                  >
                    <span className="text-white text-[10px] font-bold">$</span>
                  </div>
                  <span className="font-medium text-sm">USDC</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setAmount(availableBalance.toString())} 
                className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer mt-2"
              >
                Available: {availableBalance.toLocaleString()} {selectedCurrency}
              </button>
            </div>

            <div className="h-px bg-border my-6" />

            <Button 
              onClick={handleConfirmWithdraw} 
              className="w-full sm:w-auto h-12 px-8 rounded-xl text-base font-semibold" 
              disabled={!amount || !recipientWallet}
            >
              Confirm Withdrawal
            </Button>

            <div className="mt-6 pt-4 border-t border-border/50">
              <p className="text-xs font-bold text-foreground mb-3">Important information</p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  • Withdrawals are processed on{" "}
                  {connectedNetwork.isBase ? (
                    <><img src={baseLogo} alt="Base" className="w-4 h-4 rounded-full inline" />{" "}</>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-muted-foreground/20 inline-flex items-center justify-center text-[10px] font-bold">Ξ</span>
                  )}{" "}
                  <span className="font-semibold text-foreground/70">{connectedNetwork.name}</span> network
                </p>
                <p className="text-xs text-muted-foreground">• {connectedNetwork.name} network conditions apply</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Confirm Withdrawal</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 mt-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">External Wallet</span>
                    <span className="text-xs font-mono text-foreground truncate max-w-[180px]">{recipientWallet}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Currency</span>
                    <span className="text-sm font-medium text-foreground">{selectedCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-sm font-medium text-foreground">{parseFloat(amount || "0").toFixed(2)} {selectedCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Network Fee (Base)</span>
                    <span className="text-sm text-foreground">{networkFee.toFixed(2)} {selectedCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Service Fee</span>
                    <span className="text-sm text-foreground">{serviceFee.toFixed(2)} {selectedCurrency}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">Total</span>
                    <span className="text-base font-bold text-foreground">{getTotalAmount()} {selectedCurrency}</span>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Self-Custody Notice:</strong> This is a non-custodial withdrawal. You are responsible for ensuring the wallet address is correct. Transactions on the blockchain are irreversible.
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  By confirming, you acknowledge that you are initiating a withdrawal on the Base network and understand that blockchain transactions cannot be reversed.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalConfirm} className="rounded-xl">
              Confirm & Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Withdraw;
