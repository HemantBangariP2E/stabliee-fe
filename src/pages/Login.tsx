import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Logo from "@/components/Logo";
import { Send, Zap, Globe, ArrowUpDown, Shield } from "lucide-react";
import { useTreSoriContext } from "@/context/TreSoriProvider";
import { persistMpcSession } from "@/lib/walletSession";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [timer, setTimer] = useState(57);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otpRequested = useRef(false);

  const navigate = useNavigate();
  const { tresori, selectedChain, initialized, loading, run } = useTreSoriContext();

  // Signup flow disabled for now
  // const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    if (timer > 0 && step === "otp") {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, step]);

  const sendOtp = async () => {
    if (!email.trim() || !selectedChain) return false;
    setSendingOtp(true);
    try {
      const res = await run(() =>
        tresori.sendEmailVerificationRequest({
          chain: selectedChain,
          email: email.trim(),
          userId: email.trim().toLowerCase(),
        }),
      );
      if (res === null) return false;

      const data = res as Record<string, unknown>;
      const exists = data.isMPCExists === true;
      toast({
        title: exists ? "Welcome back" : "Creating wallet",
        description: exists
          ? "Verification code sent to your email."
          : "New wallet will be created on the enabled network after OTP verification.",
      });
      setTimer(57);
      return true;
    } finally {
      setSendingOtp(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !selectedChain) return;
    const sent = await sendOtp();
    if (sent) {
      setStep("otp");
      otpRequested.current = true;
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4 || !selectedChain || !email.trim()) return;

    setVerifying(true);
    try {
      const res = await run(() =>
        tresori.verifyEmail({
          chain: selectedChain,
          email: email.trim(),
          userId: email.trim().toLowerCase(),
          otp,
        }),
      );
      if (!res) return;

      const data = res as Record<string, unknown>;
      const walletAddress = String(data.walletAddress ?? "");
      const clientShare = String(data.clientShare ?? "");
      const sessionId = String(data.sessionId ?? "");
      const isExisting = data.isMPCExists === true;

      if (!walletAddress || !clientShare || !sessionId) {
        throw new Error("Verification succeeded but wallet session data is incomplete.");
      }

      persistMpcSession({
        email: email.trim().toLowerCase(),
        walletAddress,
        clientShare,
        sessionId,
        chain: selectedChain,
      });

      toast({
        title: isExisting ? "Signed in" : "Wallet created",
        description: isExisting
          ? "Your existing MPC wallet is ready."
          : `Wallet created on ${selectedChain.blockchain} ${selectedChain.network}.`,
      });

      navigate("/dashboard");
    } finally {
      setVerifying(false);
    }
  };

  const resendOtp = async () => {
    const sent = await sendOtp();
    if (sent) {
      toast({ title: "Code resent", description: "Check your email for a new code." });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const brandingPanel = (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-100 via-zinc-50 to-white items-center justify-center p-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-zinc-200/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-zinc-300/30 rounded-full blur-3xl" />
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
        <p className="text-zinc-500 text-base mb-10">Sign in with your email</p>
        <div className="space-y-4 text-left">
          {[
            { icon: Send, text: "Send to many", desc: "Bulk transfers made simple" },
            { icon: Zap, text: "Get paid instantly", desc: "Real-time settlements" },
            { icon: Globe, text: "Use your local money", desc: "Multi-currency support" },
            { icon: ArrowUpDown, text: "Easy funding & withdrawals", desc: "On/off ramp in seconds" },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-zinc-200"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-zinc-700" />
              </div>
              <div className="flex-1">
                <p className="text-zinc-900 font-semibold text-sm">{item.text}</p>
                <p className="text-zinc-500 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {brandingPanel}

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in with your email</p>
            {/* {selectedChain && (
              <p className="text-xs text-muted-foreground mt-2">
                Wallet network: {selectedChain.blockchain} {selectedChain.network}
              </p>
            )} */}
          </div>

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold"
                disabled={!email.trim() || !initialized || !selectedChain || sendingOtp || loading}
              >
                {sendingOtp ? "Sending code…" : "Continue"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} disabled className="h-12 rounded-xl bg-muted" />
              </div>

              <div className="space-y-2">
                <Label>One-time passcode</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3].map((i) => (
                        <InputOTPSlot key={i} index={i} className="w-12 h-12 text-xl rounded-xl border-2" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold"
                disabled={otp.length !== 4 || verifying || !selectedChain}
              >
                {verifying ? "Verifying…" : "Sign in"}
              </Button>

              <div className="text-center text-sm space-y-2">
                <p className="text-muted-foreground">Code sent to your email</p>
                <div>
                  <span className="text-muted-foreground">{formatTime(timer)}</span>
                  {timer === 0 ? (
                    <button
                      type="button"
                      onClick={resendOtp}
                      className="ml-2 text-foreground font-medium hover:underline"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <span className="ml-2 text-muted-foreground">Resend OTP</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    otpRequested.current = false;
                  }}
                  className="text-foreground font-medium hover:underline"
                >
                  Change email
                </button>
              </div>
            </form>
          )}

          {/* Signup disabled for now
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <button>Sign up</button>
          </p>
          */}
        </div>
      </div>
    </div>
  );
};

export default Login;
