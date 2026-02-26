import { RefreshCw, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface AppHeaderProps {
  walletAddress?: string;
  balance?: string;
  email?: string;
}

const AppHeader = ({ 
  walletAddress = "0x4c1a...EDE3", 
  balance = "3.300577",
  email = "user@stabilee.com"
}: AppHeaderProps) => {
  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Copied!",
      description: "Email copied to clipboard",
    });
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Placeholder for breadcrumb or other content */}
      </div>

      <div className="flex items-center gap-3">
        {/* Wallet Badge */}
        <div className="flex items-center gap-3 bg-muted/40 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">$</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{balance} <span className="text-xs font-normal text-muted-foreground">USDC</span></p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-mono">{walletAddress}</span>
              <button onClick={copyAddress} className="p-0.5 hover:bg-muted rounded transition-colors">
                <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Email Badge */}
        <div 
          onClick={copyEmail}
          className="flex items-center gap-2.5 bg-muted/40 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-border/50 cursor-pointer hover:bg-muted/60 transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
            <Mail className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium text-foreground">{email}</p>
          </div>
          <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors ml-1" />
        </div>
        
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;