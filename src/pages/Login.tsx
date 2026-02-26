import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Logo from "@/components/Logo";
import { Send, Zap, Globe, ArrowUpDown, Shield, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
type BackupStep = "none" | "password" | "success";
const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [legalBusinessName, setLegalBusinessName] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [backupStep, setBackupStep] = useState<BackupStep>("none");
  const [backupPassword, setBackupPassword] = useState("");
  const [confirmBackupPassword, setConfirmBackupPassword] = useState("");
  const countryCodes = [{
    code: "+1",
    country: "US",
    flag: "🇺🇸"
  }, {
    code: "+44",
    country: "UK",
    flag: "🇬🇧"
  }, {
    code: "+91",
    country: "IN",
    flag: "🇮🇳"
  }, {
    code: "+49",
    country: "DE",
    flag: "🇩🇪"
  }, {
    code: "+33",
    country: "FR",
    flag: "🇫🇷"
  }, {
    code: "+81",
    country: "JP",
    flag: "🇯🇵"
  }, {
    code: "+86",
    country: "CN",
    flag: "🇨🇳"
  }, {
    code: "+61",
    country: "AU",
    flag: "🇦🇺"
  }, {
    code: "+55",
    country: "BR",
    flag: "🇧🇷"
  }, {
    code: "+52",
    country: "MX",
    flag: "🇲🇽"
  }, {
    code: "+971",
    country: "UAE",
    flag: "🇦🇪"
  }, {
    code: "+65",
    country: "SG",
    flag: "🇸🇬"
  }, {
    code: "+82",
    country: "KR",
    flag: "🇰🇷"
  }, {
    code: "+27",
    country: "ZA",
    flag: "🇿🇦"
  }, {
    code: "+234",
    country: "NG",
    flag: "🇳🇬"
  }];
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      // Require name for all account types
      if (!name) {
        return;
      }
      // Additionally require business name for business accounts
      if (accountType === "business" && !legalBusinessName) {
        return;
      }
      if (email && agreedToTerms) {
        // Navigate to OTP screen for signup
        navigate("/verify-otp", {
          state: {
            email,
            name,
            isSignup: true
          }
        });
      }
    } else {
      if (email) {
        navigate("/verify-otp", {
          state: {
            email
          }
        });
      }
    }
  };
  const handleBackupConfirm = () => {
    if (backupPassword && backupPassword === confirmBackupPassword) {
      setBackupStep("success");
    }
  };
  const handleBackupCancel = () => {
    setBackupStep("none");
    setBackupPassword("");
    setConfirmBackupPassword("");
  };
  const handleBackupComplete = () => {
    navigate("/dashboard");
  };
  return <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-100 via-zinc-50 to-white items-center justify-center p-12 relative overflow-hidden">
        {/* Background decorative elements */}
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
            Your digital wallet,<br />
            <span className="text-zinc-500">across borders</span>
          </h1>
          
          <p className="text-zinc-500 text-base mb-10">
            Send, receive, and manage Digital money
          </p>
          
          <div className="space-y-4 text-left">
            {[{
            icon: Send,
            text: "Send to many",
            desc: "Bulk transfers made simple"
          }, {
            icon: Zap,
            text: "Get paid instantly",
            desc: "Real-time settlements"
          }, {
            icon: Globe,
            text: "Use your local money",
            desc: "Multi-currency support"
          }, {
            icon: ArrowUpDown,
            text: "Easy funding & withdrawals",
            desc: "On/off ramp in seconds"
          }].map((item, index) => <div key={index} className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-zinc-200 hover:bg-white hover:shadow-sm transition-all duration-300 group cursor-default" style={{
            animationDelay: `${index * 100}ms`
          }}>
                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-200 transition-colors">
                  <item.icon className="w-5 h-5 text-zinc-700" />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-900 font-semibold text-sm">{item.text}</p>
                  <p className="text-zinc-500 text-xs">{item.desc}</p>
                </div>
              </div>)}
          </div>

          <div className="mt-12 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-zinc-500 font-medium text-sm">powered by stablecoins</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login/Signup Form or Backup Flow */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-card">
        {backupStep === "none" ? <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {isSignup ? "Create Account" : "Login"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isSignup ? "Sign up to get started" : "Login to your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignup && <>
                {/* Account Type Selector - Apple Style */}
                

                {/* Full Name - For both Personal and Business */}
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                  <Input id="name" type="text" placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl" required />
                </div>

                {/* Phone Number - Only for Business (Optional) */}
                {accountType === "business" && <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="phone">
                      Phone Number <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                    </Label>
                    <div className="flex gap-2">
                      <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="h-12 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-[100px]">
                        {countryCodes.map(country => <option key={country.code} value={country.code}>
                            {country.flag} {country.code}
                          </option>)}
                      </select>
                      <Input id="phone" type="tel" placeholder="Phone number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="h-12 rounded-xl flex-1" />
                    </div>
                  </div>}

                {/* Legal Business Name - Only for Business (Required) */}
                {accountType === "business" && <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="businessName">
                      Legal Business Name <span className="text-destructive">*</span>
                    </Label>
                    <Input id="businessName" type="text" placeholder="Enter your registered business name" value={legalBusinessName} onChange={e => setLegalBusinessName(e.target.value)} className="h-12 rounded-xl" required />
                    <p className="text-xs text-muted-foreground">
                      This should match your official business registration
                    </p>
                  </div>}
              </>}

            {!isSignup && <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl" required />
              </div>}

            {isSignup && <div className="flex items-start gap-3">
                <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={checked => setAgreedToTerms(checked === true)} className="mt-0.5" />
                <Label htmlFor="terms" className="text-sm text-muted-foreground font-normal cursor-pointer">
                  By signing up, you agree to our{" "}
                  <Link to="/terms" className="text-primary font-medium hover:underline">
                    Terms & Conditions
                  </Link>
                </Label>
              </div>}

            <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={isSignup && !agreedToTerms}>
              {isSignup ? "Sign Up" : "Login"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button type="button" onClick={() => setIsSignup(!isSignup)} className="text-primary font-medium hover:underline">
              {isSignup ? "Login" : "Sign up"}
            </button>
          </p>

          {/* Developer Notes */}
          

        </div> : backupStep === "password" ? (/* Backup Password Screen */
      <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Secure Your Wallet
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Please create a backup password to recover your wallet. Keep this password safe - you'll need it to restore your wallet.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex gap-3">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Important</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    This password encrypts your wallet backup. If you lose it, you won't be able to recover your wallet.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backupPassword">Backup Password</Label>
                <Input id="backupPassword" type="password" placeholder="Enter a secure password" value={backupPassword} onChange={e => setBackupPassword(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmBackupPassword">Confirm Password</Label>
                <Input id="confirmBackupPassword" type="password" placeholder="Confirm your password" value={confirmBackupPassword} onChange={e => setConfirmBackupPassword(e.target.value)} className="h-12 rounded-xl" />
                {confirmBackupPassword && backupPassword !== confirmBackupPassword && <p className="text-xs text-destructive">Passwords do not match</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBackupCancel} className="flex-1 h-12 rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleBackupConfirm} disabled={!backupPassword || backupPassword !== confirmBackupPassword} className="flex-1 h-12 rounded-xl">
                Confirm
              </Button>
            </div>
          </div>) : (/* Backup Success Screen */
      <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Backup Created
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Your wallet backup has been created successfully. You can now access your dashboard.
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Wallet Secured</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    Remember to store your backup password in a safe place. You'll need it to recover your wallet on a new device.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleBackupComplete} className="w-full h-12 rounded-xl text-base font-semibold">
              Go to Dashboard
            </Button>
          </div>)}
      </div>
    </div>;
};
export default Login;