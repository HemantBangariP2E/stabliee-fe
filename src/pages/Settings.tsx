import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Shield, Palette, Wallet, Code } from "lucide-react";
const Settings = () => {
  const [receiverAddress, setReceiverAddress] = useState("0x7e5881f281a7c47f7064f4607d61");
  const [selectedChain, setSelectedChain] = useState("base");
  return <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="grid gap-6">

          {/* Receiver Details */}
          <Card className="p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Receiver Details</h2>
                <p className="text-sm text-muted-foreground">Configure your receiving wallet</p>
              </div>
            </div>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label className="text-sm">Chain</Label>
                <Select value={selectedChain} onValueChange={setSelectedChain}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-[#0052FF] flex items-center justify-center">
                          <span className="text-[8px] text-white font-bold">B</span>
                        </div>
                        Base Chain
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Receiver Wallet Address</Label>
                <Input placeholder="0x..." value={receiverAddress} disabled className="h-11 rounded-xl font-mono text-sm bg-muted/50 cursor-not-allowed" />
              </div>
              
            </div>
          </Card>

          {/* Notifications */}
          

          {/* Security */}
          

          {/* Appearance */}
          

          {/* Developer Notes */}
          
        </div>
      </div>
    </DashboardLayout>;
};
export default Settings;