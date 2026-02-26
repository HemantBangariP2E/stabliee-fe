import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Logo from "@/components/Logo";
import { Send, Zap, Globe, ArrowUpDown, Shield } from "lucide-react";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(57);
  const [codeSent, setCodeSent] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "user@example.com";
  const userName = location.state?.name || "User";
  const isSignup = location.state?.isSignup || false;

  useEffect(() => {
    if (timer > 0 && codeSent) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, codeSent]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      navigate("/dashboard", { state: { name: userName } });
    }
  };

  const resendOTP = () => {
    setTimer(57);
    setCodeSent(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex">
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

      {/* Right Panel - OTP Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {isSignup ? `Welcome ${userName}` : "Welcome back"}
            </h2>
            <p className="text-muted-foreground mt-1">Enter your One Time Passcode</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="email"
                value={email}
                disabled
                className="h-12 rounded-xl bg-muted"
              />
            </div>

            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="w-12 h-12 text-xl rounded-xl border-2" />
                  <InputOTPSlot index={1} className="w-12 h-12 text-xl rounded-xl border-2" />
                  <InputOTPSlot index={2} className="w-12 h-12 text-xl rounded-xl border-2" />
                  <InputOTPSlot index={3} className="w-12 h-12 text-xl rounded-xl border-2" />
                  <InputOTPSlot index={4} className="w-12 h-12 text-xl rounded-xl border-2" />
                  <InputOTPSlot index={5} className="w-12 h-12 text-xl rounded-xl border-2" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-base font-semibold"
              disabled={otp.length !== 6}
            >
              Verify OTP & Proceed
            </Button>

            {codeSent && (
              <p className="text-center text-sm text-muted-foreground">
                A verification code has been sent to your email
              </p>
            )}

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{formatTime(timer)}</span>
              {timer === 0 && (
                <button
                  type="button"
                  onClick={resendOTP}
                  className="ml-2 text-foreground font-medium hover:underline"
                >
                  Resend OTP
                </button>
              )}
              {timer > 0 && (
                <span className="ml-2 text-muted-foreground">Resend OTP</span>
              )}
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
