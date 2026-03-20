import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useRef } from "react";

import Index from "./pages/Index";
import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import BulkSend from "./pages/BulkSend";
import Receive from "./pages/Receive";
import TransactionHistory from "./pages/TransactionHistory";
import BuySell from "./pages/BuySell";
import Beneficiary from "./pages/Beneficiary";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import Withdraw from "./pages/Withdraw";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const WIDGET_SCRIPT_SRC = "http://localhost:3000/my-widget.js";

const App = () => {
  const scriptLoaded = useRef(false);

useEffect(() => {
  const existingScript = document.querySelector(
    'script[src="http://localhost:3000/my-widget.js"]'
  );

  if (existingScript) return;

  const script = document.createElement("script");
  script.src = "http://localhost:3000/my-widget.js";
  script.async = true;

  script.onload = () => {
    if (window.renderMyWidget) {
      // Initialize SDK with API key
      window.renderMyWidget(
        "kalp-wallet-container",
       
        "cce4c35335c02307321678e3a8374bd2cf477a188850d253ace283690a827919",
        "/dashboard"
      );
    }
  };

  document.body.appendChild(script);
}, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/bulk-send" element={<BulkSend />} />
            <Route path="/receive" element={<Receive />} />
            <Route path="/add-usdc" element={<Receive />} />
            <Route path="/activity" element={<TransactionHistory />} />
            <Route path="/buy-sell" element={<BuySell />} />
            <Route path="/beneficiary" element={<Beneficiary />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;