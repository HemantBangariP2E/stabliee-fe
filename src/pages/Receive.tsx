import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Copy, Wallet, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import baseLogo from "@/assets/base-logo.png";

const Receive = () => {
  const navigate = useNavigate();
  const email = "user@stabilee.com";
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`
    });
  };
  return <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
         <Card className="p-6 rounded-2xl">
          <div className="flex flex-col items-center justify-center py-8">
            {/* Back Button */}
            <button 
              onClick={() => navigate('/dashboard')}
              className="self-start mb-4 p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Header */}
            <h2 className="text-xl font-semibold text-foreground mb-4">Add USDC</h2>

            {/* Network Badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full mb-4">
              <img src={baseLogo} alt="Base" className="w-5 h-5 rounded-full" />
              <span className="text-sm font-medium text-foreground">Base Network</span>
            </div>

            {/* QR Code */}
            <div className="p-4 bg-white rounded-2xl mb-6 relative shadow-sm">
              <QRCode value="0x4c1a9cc6Cf1da9cc6Cf1daEDE3" size={160} level="M" fgColor="#000000" bgColor="#ffffff" />
            </div>

            {/* Address & Email Cards - Stacked */}
            <div className="w-full max-w-xs flex flex-col gap-2">
              {/* Wallet Address */}
              <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-sm text-foreground">0x4c1a...EDE3</span>
                </div>
                <button onClick={() => copyToClipboard("0x4c1a9cc6Cf1da9cc6Cf1daEDE3", "Address")} className="text-primary hover:text-primary/80 p-1.5 hover:bg-primary/10 rounded transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {/* Email */}
            </div>

            {/* Important Information */}
            <div className="w-full max-w-xs mt-2">
              <div className="bg-muted/50 border border-border rounded-lg p-3">
                <p className="text-xs font-bold text-foreground mb-3">Important information</p>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    • Only send USDC on Base network to this address
                  </p>
                  <p className="text-xs text-muted-foreground">• Other tokens & networks may result in loss of funds</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>;
};
export default Receive;