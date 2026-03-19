import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Copy, Wallet, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import baseLogo from "@/assets/base-logo.png";

/** CAIP-10 / EIP-155 format: eip155:chainId:address - uses chainIdConfig from localStorage */
const getQrAddressFormat = (address: string): string => {
  const chainId = localStorage.getItem("chainIdConfig") || "8453";
  return address ? `eip155:${chainId}:${address}` : "";
};

const getNetworkDisplay = (): { name: string; isBase: boolean } => {
  const chainId = localStorage.getItem("chainIdConfig") || "";
  const blockchainName = (localStorage.getItem("blockchainName") || "BASE").toUpperCase();
  if (blockchainName === "ETH" || chainId === "11155111" || chainId === "1") {
    return { name: chainId === "1" ? "Ethereum" : "Ethereum (Sepolia)", isBase: false };
  }
  return { name: chainId === "84532" ? "Base Sepolia" : "Base", isBase: true };
};

const getTokenLabel = (): string => {
  const chainId = localStorage.getItem("chainIdConfig") || "";
  const blockchainName = (localStorage.getItem("blockchainName") || "BASE").toUpperCase();
  return blockchainName === "ETH" || chainId === "11155111" || chainId === "1" ? "USDT" : "USDC";
};

const Receive = () => {
  const navigate = useNavigate();
  const ownerAddress = localStorage.getItem("ownerAddress") || "";
  const network = getNetworkDisplay();
  const tokenLabel = getTokenLabel();
  const qrValue = getQrAddressFormat(ownerAddress);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Card className="p-6 rounded-2xl">
          <div className="flex flex-col items-center justify-center py-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="self-start mb-4 p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-foreground mb-4">Receive {tokenLabel}</h2>

            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full mb-4">
              {network.isBase ? (
                <img src={baseLogo} alt="Base" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px] font-bold">Ξ</div>
              )}
              <span className="text-sm font-medium text-foreground">{network.name}</span>
            </div>

            <div className="p-4 bg-white rounded-2xl mb-6 shadow-lg w-full max-w-[280px] box-border">
              <QRCode
                value={qrValue}
                size={256}
                level="M"
                fgColor="#000000"
                bgColor="#FFFFFF"
                className="w-full h-auto"
              />
            </div>

            <div className="w-full max-w-xs flex flex-col gap-2">
              <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Wallet className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-mono text-sm text-foreground truncate">
                    {ownerAddress ? `${ownerAddress.slice(0, 10)}...${ownerAddress.slice(-8)}` : "—"}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(ownerAddress, "Address")}
                  className="text-primary hover:text-primary/80 p-1.5 hover:bg-primary/10 rounded transition-colors flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="w-full max-w-xs mt-2">
              <div className="bg-muted/50 border border-border rounded-lg p-3">
                <p className="text-xs font-bold text-foreground mb-3">Important information</p>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    • Only send {tokenLabel} on {network.name} to this address
                  </p>
                  <p className="text-xs text-muted-foreground">• Other tokens & networks may result in loss of funds</p>
                  <p className="text-xs text-muted-foreground">• Scan this QR in any crypto wallet to pre-fill address and network</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
export default Receive;