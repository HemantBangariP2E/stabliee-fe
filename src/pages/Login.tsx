import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Logo from "@/components/Logo";
import { Send, Zap, Globe, ArrowUpDown, Shield } from "lucide-react";
import { useTreSoriContext } from "@/context/TreSoriProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [legalBusinessName, setLegalBusinessName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedBlockchain, setSelectedBlockchain] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");

  const navigate = useNavigate();
  const { chains, selectedChain, setSelectedChain, initialized, loading } = useTreSoriContext();

  const blockchains = useMemo(() => {
    const set = new Set(chains.map((c) => c.blockchain));
    return [...set].sort();
  }, [chains]);

  const networks = useMemo(() => {
    if (!selectedBlockchain) return [];
    return chains.filter((c) => c.blockchain === selectedBlockchain);
  }, [chains, selectedBlockchain]);

  useEffect(() => {
    if (!selectedChain) return;
    setSelectedBlockchain(selectedChain.blockchain);
    setSelectedNetwork(selectedChain.network);
  }, [selectedChain]);

  const handleBlockchainChange = (blockchain: string) => {
    setSelectedBlockchain(blockchain);
    const first = chains.find((c) => c.blockchain === blockchain);
    if (first) {
      setSelectedNetwork(first.network);
      setSelectedChain(first);
    }
  };

  const handleNetworkChange = (network: string) => {
    setSelectedNetwork(network);
    const chain = chains.find(
      (c) => c.blockchain === selectedBlockchain && c.network === network,
    );
    if (chain) setSelectedChain(chain);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChain) return;

    if (isSignup) {
      if (!name) return;
      if (accountType === "business" && !legalBusinessName) return;
      if (email && agreedToTerms) {
        navigate("/verify-otp", {
          state: {
            email,
            name,
            isSignup: true,
            chainId: selectedChain.chainId,
          },
        });
      }
    } else if (email) {
      navigate("/verify-otp", {
        state: {
          email,
          chainId: selectedChain.chainId,
        },
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-100 via-zinc-50 to-white items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-zinc-200/50 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-zinc-300/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-zinc-200/50 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-zinc-300/30 rounded-full" />
        </div>

        <div className="max-w-md text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-zinc-900/5 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-zinc-200">
            <Shield className="w-4 h-4 text-zinc-600" />
            <span className="text-sm text-zinc-700 font-medium">Secured by blockchain</span>
          </div>

          <h1 className="text-4xl font-bold text-zinc-900 mb-4 leading-tight">
            Your digital wallet,
            <br />
            <span className="text-zinc-500">across borders</span>
          </h1>

          <p className="text-zinc-500 text-base mb-10">Send, receive, and manage Digital money</p>

          <div className="space-y-4 text-left">
            {[
              { icon: Send, text: "Send to many", desc: "Bulk transfers made simple" },
              { icon: Zap, text: "Get paid instantly", desc: "Real-time settlements" },
              { icon: Globe, text: "Use your local money", desc: "Multi-currency support" },
              { icon: ArrowUpDown, text: "Easy funding & withdrawals", desc: "On/off ramp in seconds" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-zinc-200 hover:bg-white hover:shadow-sm transition-all duration-300 group cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-200 transition-colors">
                  <item.icon className="w-5 h-5 text-zinc-700" />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-900 font-semibold text-sm">{item.text}</p>
                  <p className="text-zinc-500 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-zinc-500 font-medium text-sm">powered by stablecoins</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {isSignup ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isSignup ? "Sign up with your email" : "Sign in with your email"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            {isSignup && accountType === "business" && (
              <div className="space-y-2">
                <Label htmlFor="business">Legal business name</Label>
                <Input
                  id="business"
                  value={legalBusinessName}
                  onChange={(e) => setLegalBusinessName(e.target.value)}
                  className="h-12 rounded-xl"
                  placeholder="Business name"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Blockchain</Label>
              <Select
                value={selectedBlockchain}
                onValueChange={handleBlockchainChange}
                disabled={!initialized || blockchains.length === 0}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder={loading ? "Loading networks…" : "Select blockchain"} />
                </SelectTrigger>
                <SelectContent>
                  {blockchains.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Network</Label>
              <Select
                value={selectedNetwork}
                onValueChange={handleNetworkChange}
                disabled={!selectedBlockchain || networks.length === 0}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {networks.map((c) => (
                    <SelectItem key={c.id} value={c.network}>
                      {c.network} (chain {c.chainId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isSignup && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(v) => setAgreedToTerms(v === true)}
                />
                <Label htmlFor="terms" className="text-sm font-normal">
                  I agree to the terms and conditions
                </Label>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold"
              disabled={!email || !selectedChain || (isSignup && !agreedToTerms)}
            >
              Continue
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-foreground font-medium hover:underline"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
