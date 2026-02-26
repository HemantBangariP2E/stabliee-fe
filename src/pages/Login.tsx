import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Logo from "@/components/Logo";
import NewLogin from "./NewLogIn";
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
            <NewLogin />
      </div>
    </div>;
};
export default Login;