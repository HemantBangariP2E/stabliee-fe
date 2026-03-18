import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wallet, Copy } from "lucide-react";
import { supabase } from "@/hooks/supabaseClient";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [chainSummary, setChainSummary] = useState("");

  useEffect(() => {
    const name = (localStorage.getItem("blockchainName") || "BASE").toUpperCase();
    const id = localStorage.getItem("chainIdConfig") || "—";
    setChainSummary(`${name === "ETH" ? "Ethereum" : "Base"} · Chain ID ${id}`);
  }, []);

  useEffect(() => {
    const run = async () => {
      const fromLs = localStorage.getItem("ownerAddress")?.trim() || "";
      const userId = localStorage.getItem("userIdentifier")?.trim() || "";

      if (fromLs) {
        setWalletAddress(fromLs);
      }

      if (!userId && !fromLs) {
        if (!fromLs) setWalletAddress("");
        return;
      }

      let q = supabase.from("user_logins").select("owner_address");
      if (userId) {
        q = q.eq("user_identifier", userId);
      } else {
        q = q.eq("owner_address", fromLs);
      }
      const { data, error } = await q.maybeSingle();
      if (!error && data?.owner_address) {
        setWalletAddress(data.owner_address);
      } else if (!fromLs) {
        setWalletAddress("");
      }
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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Account & wallet</h1>
          <p className="text-muted-foreground">
            Manage your receiving wallet and network
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Receiver Details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your connected MPC / receiving wallet
                </p>
              </div>
            </div>
            <div className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label className="text-sm">Network</Label>
                <Input
                  readOnly
                  value={chainSummary}
                  className="h-11 rounded-xl bg-muted/50 text-sm"
                  placeholder="—"
                />
                <p className="text-xs text-muted-foreground">
                  Set when you connect your wallet. Change network from the login /
                  connect flow.
                </p>
              </div>
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
                    No wallet found. Sign in from the login page so your address is
                    stored, then open Settings again.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Notifications */}
          

          {/* Security */}
          

          {/* Appearance */}
          

          {/* Developer Notes */}
          
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
