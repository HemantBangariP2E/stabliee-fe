import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Link2, Info, Copy, Globe, Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
interface WalletMapping {
  email: string;
  wallet: string;
  businessContext: string;
  discoveryEnabled: boolean;
}
const Profile = () => {
  const [emailMappingEnabled, setEmailMappingEnabled] = useState(true);
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("fr");
  const [displayName, setDisplayName] = useState("");
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [pendingDisableIndex, setPendingDisableIndex] = useState<number | null>(null);
  const [pendingGlobalDisable, setPendingGlobalDisable] = useState(false);

  // Mock wallet mappings (limited to 3) with discovery toggle
  const [walletMappings, setWalletMappings] = useState<WalletMapping[]>([{
    email: "user@stabilee.com",
    wallet: "0x4c1a9cc6Cf1da9cc6Cf1daEDE3",
    businessContext: "Acme Corp",
    discoveryEnabled: true
  }, {
    email: "user@stabilee.com",
    wallet: "0x7b2e8dd7Af2eb8dd7Af2ebFGH4",
    businessContext: "TechStart Inc",
    discoveryEnabled: true
  }, {
    email: "user@stabilee.com",
    wallet: "0x9f3c1ee8Bg3fc1ee8Bg3fcIJK5",
    businessContext: "Global Payments Ltd",
    discoveryEnabled: false
  }]);
  const toggleMappingDiscovery = (index: number) => {
    const mapping = walletMappings[index];
    if (mapping.discoveryEnabled) {
      // Show confirmation when disabling
      setPendingDisableIndex(index);
      setShowDisableConfirm(true);
    } else {
      // Enable directly without confirmation
      setWalletMappings(prev => prev.map((m, i) => i === index ? {
        ...m,
        discoveryEnabled: true
      } : m));
    }
  };
  const handleGlobalToggle = (checked: boolean) => {
    if (!checked) {
      // Show confirmation when disabling
      setPendingGlobalDisable(true);
      setShowDisableConfirm(true);
    } else {
      setEmailMappingEnabled(true);
    }
  };
  const confirmDisable = () => {
    if (pendingDisableIndex !== null) {
      setWalletMappings(prev => prev.map((m, i) => i === pendingDisableIndex ? {
        ...m,
        discoveryEnabled: false
      } : m));
      setPendingDisableIndex(null);
    }
    if (pendingGlobalDisable) {
      setEmailMappingEnabled(false);
      setPendingGlobalDisable(false);
    }
    setShowDisableConfirm(false);
  };
  const cancelDisable = () => {
    setPendingDisableIndex(null);
    setPendingGlobalDisable(false);
    setShowDisableConfirm(false);
  };

  // Default user details (non-editable)
  const userEmail = "user@stabilee.com";
  const userWalletAddress = "0x4c1a9cc6Cf1da9cc6Cf1daEDE3";
  const copyEmail = () => {
    navigator.clipboard.writeText(userEmail);
    toast({
      title: "Copied!",
      description: "Email address copied to clipboard"
    });
  };
  const copyWalletAddress = () => {
    navigator.clipboard.writeText(userWalletAddress);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard"
    });
  };
  return <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">Manage your profile and personal details</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Details */}
          <Card className="p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
            </div>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input placeholder="Enter your name" value={displayName} onChange={e => setDisplayName(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="relative">
                  <Input type="email" value={userEmail} disabled className="h-11 rounded-xl bg-muted/50 cursor-not-allowed pr-10" />
                  <button onClick={copyEmail} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <div className="relative">
                  <Input value={userWalletAddress} disabled className="h-11 rounded-xl bg-muted/50 cursor-not-allowed font-mono text-sm pr-10" />
                  <button onClick={copyWalletAddress} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
            </div>
          </Card>

          {/* Language Settings */}
          <Card className="p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Language & Region</h2>
                <p className="text-sm text-muted-foreground">Set your preferred language</p>
              </div>
            </div>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label className="text-sm">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    <SelectItem value="en">
                      <div className="flex items-center gap-2">
                        <span>🇺🇸</span>
                        English
                      </div>
                    </SelectItem>
                    <SelectItem value="fr">
                      <div className="flex items-center gap-2">
                        <span>🇫🇷</span>
                        Français
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    <SelectItem value="fr">
                      <div className="flex items-center gap-2">
                        <span>🇫🇷</span>
                        France
                      </div>
                    </SelectItem>
                    <SelectItem value="dk">
                      <div className="flex items-center gap-2">
                        <span>🇩🇰</span>
                        Denmark
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Email & Wallet Mapping */}
          
        </div>
      </div>

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Email Payment Consent?</AlertDialogTitle>
            <AlertDialogDescription>
              By disabling this consent, others will no longer be able to find you or send payments using your email address. You may be removed from existing contact lists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDisable}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>;
};
export default Profile;