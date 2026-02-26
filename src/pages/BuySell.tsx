import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, X, Building2, Smartphone, ShieldCheck } from "lucide-react";
import baseLogo from "@/assets/base-logo.png";

const fiatCurrencies = [{
  code: "NGN",
  name: "Nigerian Naira",
  symbol: "₦",
  flag: "🇳🇬"
}, {
  code: "KES",
  name: "Kenyan Shilling",
  symbol: "KSh",
  flag: "🇰🇪"
}, {
  code: "ZAR",
  name: "South African Rand",
  symbol: "R",
  flag: "🇿🇦"
}];

const stablecoins = [{
  id: "USDC",
  name: "USD Coin",
  symbol: "$",
  color: "#2775CA"
}] as const;

type StablecoinId = typeof stablecoins[number]["id"];

const BuySell = () => {
  const [searchParams] = useSearchParams();
  const coinFromUrl = searchParams.get("coin") as StablecoinId | null;
  const actionFromUrl = searchParams.get("action");
  const [selectedFiat, setSelectedFiat] = useState("NGN");
  const [selectedStablecoin, setSelectedStablecoin] = useState<StablecoinId>(coinFromUrl && stablecoins.some(c => c.id === coinFromUrl) ? coinFromUrl : "USDC");
  const [showWidget, setShowWidget] = useState(false);
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>(actionFromUrl === 'sell' ? 'sell' : 'buy');

  const selectedFiatData = fiatCurrencies.find(c => c.code === selectedFiat);
  const selectedStablecoinData = stablecoins.find(c => c.id === selectedStablecoin);

  const handleOpenWidget = () => {
    setShowWidget(true);
  };

  return <DashboardLayout>
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 rounded-2xl">
        <div className="flex flex-col items-center justify-center py-8">
          {/* Divider */}
          <div className={`w-full border-t border-border/50 pt-6 ${showWidget ? 'max-w-lg' : 'max-w-sm'}`}>
            {showWidget ? (
              <>
                {/* Widget Header with Close Button */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-foreground">
                    {transactionType === 'buy' ? 'Buy' : 'Sell'} {selectedStablecoin}
                  </p>
                  <button 
                    onClick={() => setShowWidget(false)} 
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    <X className="w-3.5 h-3.5" />
                    Close widget
                  </button>
                </div>
                {/* Embedded Yellow Card Widget */}
                <iframe 
                  src={`https://sandbox--payments-widget.netlify.app/landing/f39509f0e7234ca05f0bfe16d0abcc15?txType=${transactionType === 'buy' ? 'Buy' : 'Sell'}&token=${selectedStablecoin}&network=BASE`} 
                  className="w-full h-[750px] rounded-xl border border-border" 
                  allow="clipboard-write; camera https://sandbox--payments-widget.netlify.app" 
                  title={`${transactionType === 'buy' ? 'Buy' : 'Sell'} Stablecoin Widget`} 
                />
              </>
            ) : (
              <>
                {/* Buy/Sell Toggle */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Transaction Type</p>
                  <div className="flex gap-2 p-1 bg-muted rounded-xl">
                    <button
                      onClick={() => setTransactionType('buy')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                        transactionType === 'buy' 
                          ? 'bg-background text-green-500 shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Buy
                    </button>
                    <button
                      onClick={() => setTransactionType('sell')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                        transactionType === 'sell' 
                          ? 'bg-background text-red-500 shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <TrendingDown className="w-4 h-4" />
                      Sell
                    </button>
                  </div>
                </div>

                {/* Digital Currency Selector */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Digital Currency</p>
                  <Select value={selectedStablecoin} onValueChange={value => setSelectedStablecoin(value as StablecoinId)}>
                    <SelectTrigger className="h-14 rounded-xl bg-muted border-0 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{
                          backgroundColor: selectedStablecoinData?.color
                        }}>
                          <span className="text-white text-xs font-bold">{selectedStablecoinData?.symbol}</span>
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-foreground text-sm">{selectedStablecoin}</span>
                          <span className="text-[10px] text-muted-foreground">{selectedStablecoinData?.name}</span>
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-background">
                      {stablecoins.map(coin => (
                        <SelectItem key={coin.id} value={coin.id} className="rounded-lg py-3 px-3 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{
                              backgroundColor: coin.color
                            }}>
                              <span className="text-white text-xs font-bold">{coin.symbol}</span>
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{coin.id}</span>
                              <span className="text-xs text-muted-foreground">{coin.name}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Local Currency Selector */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Local Currency</p>
                  <Select value={selectedFiat} onValueChange={setSelectedFiat}>
                    <SelectTrigger className="h-14 rounded-xl bg-muted border-0 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{selectedFiatData?.flag}</span>
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-foreground text-sm">{selectedFiat}</span>
                          <span className="text-[10px] text-muted-foreground">{selectedFiatData?.name}</span>
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-background">
                      {fiatCurrencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code} className="rounded-lg py-3 px-3 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{currency.flag}</span>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{currency.code}</span>
                              <span className="text-xs text-muted-foreground">{currency.name}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Available Payment Methods */}
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground mb-2">
                    {transactionType === 'buy' ? 'Available Payment Methods' : 'Available Withdrawal Methods'}
                  </p>
                  <div className="flex gap-3">
                    {(selectedFiat === 'NGN' || selectedFiat === 'ZAR') && (
                      <div className="flex-1 bg-muted/50 border border-border rounded-lg p-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Bank</span>
                      </div>
                    )}
                    {selectedFiat === 'KES' && (
                      <div className="flex-1 bg-muted/50 border border-border rounded-lg p-3 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Mobile</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buy/Sell Button */}
                <button
                  onClick={handleOpenWidget}
                  className={`w-full py-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    transactionType === 'buy'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {transactionType === 'buy' ? (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      Buy {selectedStablecoin}
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4" />
                      Sell {selectedStablecoin}
                    </>
                  )}
                </button>

                {/* Base Secure Footer */}
                <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
                  <img src={baseLogo} alt="Base" className="w-4 h-4 rounded-full" />
                  <span className="text-xs font-medium">base</span>
                  <span className="text-xs">•</span>
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium">secure</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  </DashboardLayout>;
};

export default BuySell;