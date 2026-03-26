import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DollarSign, ArrowUpRight, History, Settings, LogOut, ChevronDown, User, Copy, QrCode, ChevronsRight, Wallet, Mail } from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import QRCodeComponent from "react-qr-code";
import baseLogo from "@/assets/base-logo.png";
import { supabase } from "@/hooks/supabaseClient";
import { getAccountChainId } from "@/lib/accountScope";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const navItems = [
  { title: "Send", url: "/transactions", icon: ArrowUpRight },
  { title: "Bulk Send", url: "/bulk-send", icon: ChevronsRight },
  { title: "Activity", url: "/activity", icon: History },
];

interface TopNavProps {
  walletAddress?: string;
  balance?: string;
  email?: string;
}

const TopNav = ({ 
  walletAddress: walletAddressProp, 
  balance = "3.300577",
  email: emailProp
}: TopNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [email, setEmail] = useState(emailProp ?? "");
  const [walletAddress, setWalletAddress] = useState(walletAddressProp ?? "");
  const [fullWalletAddress, setFullWalletAddress] = useState("");
  const [networkVersion, setNetworkVersion] = useState(0);

  const userIdentifier = typeof window !== "undefined" ? localStorage.getItem("userIdentifier") || "" : "";
  const ownerAddress = typeof window !== "undefined" ? localStorage.getItem("ownerAddress") || "" : "";

  useEffect(() => {
    const ethereum = (window as { ethereum?: { on?: (e: string, h: () => void) => void; removeListener?: (e: string, h: () => void) => void } }).ethereum;
    const onChainChanged = () => setNetworkVersion((v) => v + 1);
    ethereum?.on?.("chainChanged", onChainChanged);
    return () => ethereum?.removeListener?.("chainChanged", onChainChanged);
  }, []);

  useEffect(() => {
    if (!userIdentifier && !ownerAddress) {
      if (emailProp) setEmail(emailProp);
      if (walletAddressProp) {
        setWalletAddress(walletAddressProp);
        setFullWalletAddress(walletAddressProp);
      }
      return;
    }
    const fetchUser = async () => {
      const chainId = getAccountChainId();
      let q = supabase.from("user_logins").select("user_identifier, owner_address");
      if (userIdentifier) q = q.eq("user_identifier", userIdentifier).eq("chain_id", chainId);
      else q = q.eq("owner_address", ownerAddress).eq("chain_id", chainId);
      const { data, error } = await q.maybeSingle();
      if (error || !data) {
        if (emailProp) setEmail(emailProp);
        if (walletAddressProp) {
          setWalletAddress(walletAddressProp);
          setFullWalletAddress(walletAddressProp);
        } else if (ownerAddress) {
          setFullWalletAddress(ownerAddress);
          setWalletAddress(ownerAddress.slice(0, 6) + "..." + ownerAddress.slice(-4));
        }
        return;
      }
      if (data.user_identifier) setEmail(data.user_identifier);
      if (data.owner_address) {
        setFullWalletAddress(data.owner_address);
        setWalletAddress(
          data.owner_address.slice(0, 6) + "..." + data.owner_address.slice(-4)
        );
      }
    };
    fetchUser();
  }, [userIdentifier, ownerAddress, emailProp, walletAddressProp, networkVersion]);

  const displayWallet = fullWalletAddress || ownerAddress;
  const shortWallet = walletAddress || (ownerAddress ? `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}` : "");
  const displayEmail = email || userIdentifier || emailProp || "";

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const copyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(displayEmail);
    toast({
      title: "Copied!",
      description: "Email address copied to clipboard",
    });
  };

  const copyWalletAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(displayWallet);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  return (
    <header className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50 overflow-hidden">
      {/* Main header row */}
      <div className="h-16 max-w-[1800px] mx-auto px-3 md:px-6 flex items-center justify-between">
        {/* Left: Logo */}
        <Link 
          to="/dashboard" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex-shrink-0"
        >
          <Logo size="sm" />
        </Link>

        {/* Center: Navigation (Desktop only) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url;
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.url}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                )}
              >
                <Icon className={cn("w-4 h-4", item.title === "Bulk Send" && "-rotate-45")} />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Right: Receive QR + Profile */}
        <div className="flex items-center gap-2">
          {/* QR Code Button */}
          <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
            <DialogTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all",
                  "hover:bg-muted/50 text-muted-foreground hover:text-primary"
                )}
              >
                <QrCode className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">Receive</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">Receive USDC</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center py-6">
                {/* Network Badge */}
                <div className="flex items-center gap-2 mb-4 px-3 py-1.5 bg-muted rounded-full">
                  <img src={baseLogo} alt="Base" className="w-5 h-5 rounded-full" />
                  <span className="text-sm font-medium">Base Network</span>
                </div>

                {/* QR Code */}
                <div className="p-4 bg-white rounded-2xl mb-6 shadow-sm">
                  <QRCodeComponent 
                    value={displayWallet} 
                    size={180}
                    level="M"
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>

                {/* Address & Email Cards */}
                <div className="w-full max-w-xs grid grid-cols-2 gap-2">
                  {/* Wallet Address */}
                  <div className="bg-muted/50 border border-border rounded-lg px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Wallet className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-xs text-foreground truncate max-w-[70px]">{shortWallet}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(displayWallet);
                        toast({ title: "Copied!", description: "Address copied to clipboard" });
                      }}
                      className="text-primary hover:text-primary/80 p-1 hover:bg-primary/10 rounded transition-colors flex-shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Email */}
                  <div className="bg-muted/50 border border-border rounded-lg px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-foreground truncate max-w-[70px]">{displayEmail ? (displayEmail.length > 8 ? `${displayEmail.slice(0, 8)}...` : displayEmail) : "—"}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(displayEmail);
                        toast({ title: "Copied!", description: "Email copied to clipboard" });
                      }}
                      className="text-primary hover:text-primary/80 p-1 hover:bg-primary/10 rounded transition-colors flex-shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info Note */}
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Only send USDC on Base network to this address
                </p>
              </div>
            </DialogContent>
          </Dialog>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">
                    {(displayEmail && displayEmail.charAt(0).toUpperCase()) || "?"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-card border border-border z-50">
              <div className="px-3 py-2 border-b border-border">
                <button 
                  onClick={copyEmail}
                  className="flex items-center justify-between w-full group"
                >
                  <p className="text-sm font-medium text-foreground truncate">{displayEmail || "—"}</p>
                  <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </button>
                <button 
                  onClick={copyWalletAddress}
                  className="flex items-center justify-between w-full mt-1 group"
                >
                  <p className="text-xs text-muted-foreground font-mono truncate">{shortWallet || "—"}</p>
                  <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </button>
              </div>
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-border/30">
        <div className="flex items-center justify-between px-6 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url;
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.url}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-full transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", item.title === "Bulk Send" && "-rotate-45")} />
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

export default TopNav;
