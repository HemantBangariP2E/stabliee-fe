import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import baseLogo from "@/assets/base-logo.png";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/hooks/supabaseClient";
import { ethers } from "ethers";
import { GasFeeDisplay } from "@/components/GasFeeDisplay";

interface BulkTransferRow {
  recipient: string;
  amount: number;
  currency?: string;
  fee?: number;
  errors?: string[];
  to_email?: string; // for DB logging when recipient is email
  walletAddress?: string; // for blockchain use when recipient is email
}
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
const isValidWallet = (wallet: string): boolean => {
  const walletRegex = /^0x[a-fA-F0-9]{40}$/;
  return walletRegex.test(wallet);
};
// const insertTransaction = async ({
//   txHash,
//   to,
//   amount,
//   direction,
//   status,
//   gasFee = 0,
//   ownerAddress,
//   fromAddress 
// }: {
//   txHash: string
//   to: string
//   amount: number
//   direction: "SEND" | "RECEIVE"
//   status: "SUCCESS" | "PENDING" | "FAILED"
//   gasFee?: number,
//   ownerAddress?: string,
//   fromAddress?: string
// }) => {
//   // const ownerAddress = localStorage.getItem("ownerAddress")

//   if (!ownerAddress) return

//   const { error } = await supabase.from("transactions").insert({
//     tx_hash: txHash,
//     owner_address: ownerAddress,
//     from_address: ownerAddress,
//     to_address: to,
//     amount: amount,
//     token_symbol: selectedCurrency,
//     direction,
//     status,
//     gas_fee: gasFee,
//   })

//   if (error) {
//     console.error("Supabase insert error:", error.message)
//   }
// }

const getGasChain = (): "base" | "eth" => {
  if (typeof window === "undefined") return "base";
  const chainId = localStorage.getItem("chainIdConfig");
  const blockchainName = (localStorage.getItem("blockchainName") || "BASE").toUpperCase();
  return blockchainName === "ETH" || chainId === "11155111" ? "eth" : "base";
};

const getRpcUrlForGas = (): string => {
  if (typeof window === "undefined") return "https://sepolia.base.org";
  const chainId = localStorage.getItem("chainIdConfig");
  const blockchainName = (localStorage.getItem("blockchainName") || "BASE").toUpperCase();
  if (blockchainName === "ETH" || chainId === "11155111") {
    const fromEnv = import.meta.env.VITE_ETH_SEPOLIA_RPC as string | undefined;
    return fromEnv || "https://ethereum-sepolia-rpc.publicnode.com";
  }
  return chainId === "84532" ? "https://sepolia.base.org" : "https://mainnet.base.org";
};

const BulkSend = () => {
  const [bulkSendMode, setBulkSendMode] = useState<"email" | "wallet">("email");
  const [bulkTransferData, setBulkTransferData] = useState<BulkTransferRow[]>([]);
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [showBulkConfirmDialog, setShowBulkConfirmDialog] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkTxHash, setBulkTxHash] = useState("");
  const [bulkTxUrl, setBulkTxUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const networkFee = 1;
  const feePercent = 0.01; // 1%
  const [ethPriceUsd, setEthPriceUsd] = useState<number | null>(null);
  const [gasFeeInTokens, setGasFeeInTokens] = useState(0); // Network Gas in token (USDC/USDT) for bulk tx
  const gasFee = gasFeeInTokens;
  const gasFeeOnePercent = gasFee * feePercent;
  const gasChain = getGasChain();

  // Fetch ETH price every 15 minutes (shared for bulk gas estimate)
  useEffect(() => {
    let cancelled = false;
    const COINGECKO_INTERVAL_MS = 15 * 60 * 1000;
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json?.ethereum?.usd != null) {
          setEthPriceUsd(Number(json.ethereum.usd));
        }
      } catch {
        // keep last price
      }
    };
    fetchPrice();
    const t = setInterval(fetchPrice, COINGECKO_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // Estimate bulk Network Gas using SDK + live gas price
  const estimateBulkGasFee = async () => {
    try {
      const ownerAddress = localStorage.getItem("ownerAddress") || "";
      const chainIdStr = localStorage.getItem("chainIdConfig") || "";
      const tokenAddress = "0x28bD35b56bfCa732C7DF2F2d08312169189605A8";

      if (!ownerAddress || !chainIdStr || !ethPriceUsd || bulkTransferData.length === 0) {
        return;
      }

      const chainId = parseInt(chainIdStr, 10);
      if (!Number.isFinite(chainId)) {
        console.error("estimateBulkGasFee: invalid chainId", chainIdStr);
        setGasFeeInTokens(0);
        return;
      }

      const recipients = bulkTransferData.map((r) => ({
        to: r.walletAddress || r.recipient,
        amount: r.amount,
      }));

      const win = window as any;
      if (typeof win.estimateMPCBulkGas !== "function") {
        console.error("estimateBulkGasFee: window.estimateMPCBulkGas is not available");
        // fall back to simple per-recipient estimate
        await estimateBulkGasFeeFallback(chainId, tokenAddress, ownerAddress, bulkTransferData.length);
        return;
      }

      const gasLimitRaw = await win.estimateMPCBulkGas(
        ownerAddress,
        recipients,
        chainId,
        tokenAddress
      );

      const gasLimit = typeof gasLimitRaw === "bigint" ? gasLimitRaw : BigInt(gasLimitRaw);

      const rpcUrl = getRpcUrlForGas();
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const feeData = await provider.getFeeData();
      if (!feeData.gasPrice) {
        console.error("estimateBulkGasFee: feeData.gasPrice is null");
        await estimateBulkGasFeeFallback(chainId, tokenAddress, ownerAddress, bulkTransferData.length);
        return;
      }

      const gasCostWei = gasLimit * feeData.gasPrice;
      const gasCostEth = Number(ethers.formatEther(gasCostWei));
      if (!Number.isFinite(gasCostEth)) {
        console.error("estimateBulkGasFee: gasCostEth is not finite", gasCostEth);
        await estimateBulkGasFeeFallback(chainId, tokenAddress, ownerAddress, bulkTransferData.length);
        return;
      }

      const gasCostUsd = gasCostEth * ethPriceUsd;
      setGasFeeInTokens(Math.round(gasCostUsd * 1e6) / 1e6);
    } catch (err) {
      console.error("estimateBulkGasFee: error estimating gas", err);
      // fallback to simple estimate if SDK-based fails
      const ownerAddress = localStorage.getItem("ownerAddress") || "";
      const chainIdStr = localStorage.getItem("chainIdConfig") || "";
      const tokenAddress = "0x28bD35b56bfCa732C7DF2F2d08312169189605A8";
      const chainId = parseInt(chainIdStr || "0", 10);
      if (ownerAddress && Number.isFinite(chainId)) {
        await estimateBulkGasFeeFallback(chainId, tokenAddress, ownerAddress, bulkTransferData.length);
      }
    }
  };

  // Fallback estimator: approximate gas as 65k per recipient when SDK estimator isn't available
  const estimateBulkGasFeeFallback = async (
    chainId: number,
    tokenAddress: string,
    ownerAddress: string,
    recipientCount: number
  ) => {
    try {
      if (!ethPriceUsd || recipientCount <= 0) return;
const baseGas = 120000;
const perRecipientGas = 35000;

const totalGasLimit = BigInt(baseGas + recipientCount * perRecipientGas);
      const rpcUrl = getRpcUrlForGas();
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const feeData = await provider.getFeeData();
      if (!feeData.gasPrice) return;
      const gasCostWei = totalGasLimit * feeData.gasPrice;
      const gasCostEth = Number(ethers.formatEther(gasCostWei));
      if (!Number.isFinite(gasCostEth)) return;
      const gasCostUsd = gasCostEth * ethPriceUsd;
      setGasFeeInTokens((prev) =>
        gasCostUsd > 0 ? Math.round(gasCostUsd * 1e6) / 1e6 : prev
      );
    } catch (fallbackErr) {
      console.error("estimateBulkGasFeeFallback: error", fallbackErr);
    }
  };

  useEffect(() => {
    estimateBulkGasFee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkTransferData, ethPriceUsd]);
const fetchEmailWalletMap = async (emails: string[]) => {
  if (!emails.length) return {};

  const { data, error } = await supabase
    .from("user_logins")
    .select("user_identifier, owner_address")
    .in("user_identifier", emails);

  if (error) {
    console.error("Email check error", error);
    return {};
  }

  const map: Record<string, string> = {};

  data.forEach((u) => {
    map[u.user_identifier.toLowerCase()] = u.owner_address;
  });

  return map;
};
  // const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;
  
  //   const reader = new FileReader();
  //   reader.onload = e => {
  //     const text = e.target?.result as string;
  //     const lines = text.trim().split("\n");
  //     const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
  //     const recipientCol = headers.findIndex(h => h.includes("email") || h.includes("wallet") || h.includes("owneraddress") || h === "owneraddress");
  //     const amountCol = headers.findIndex(h => h.includes("amount"));
  //     const currencyCol = headers.findIndex(h => h.includes("currency"));

  //     if (recipientCol === -1 || amountCol === -1) {
  //       toast({
  //         title: "Invalid CSV Format",
  //         description: "CSV must have email/wallet and amount columns",
  //         variant: "destructive"
  //       });
  //       return;
  //     }

  //     const data: BulkTransferRow[] = [];
  //     for (let i = 1; i < lines.length; i++) {
  //       const values = lines[i].split(",").map(v => v.trim());
  //       if (values.length < 2) continue;

  //       const recipient = values[recipientCol] ?? "";
  //       const amount = parseFloat(values[amountCol]);
  //       const currency = currencyCol !== -1 ? (values[currencyCol] || "USD").toUpperCase() : "USD";
  //       const errors: string[] = [];

  //       if (!recipient) {
  //         errors.push("Recipient is empty");
  //       } else if (recipient.startsWith("0x")) {
  //         if (!isValidWallet(recipient)) errors.push("Invalid wallet address format");
  //       } else if (!isValidEmail(recipient)) {
  //         errors.push("Invalid email format");
  //       }

  //       if (isNaN(amount) || amount <= 0) {
  //         errors.push("Invalid amount");
  //       }

  //       if (!["USD", "USDC", "EURC"].includes(currency)) {
  //         errors.push("Invalid currency (use USD, USDC or EURC)");
  //       }

  //       data.push({
  //         recipient,
  //         amount: isNaN(amount) ? 0 : amount,
  //         currency,
  //         // fee: networkFee,
  //         errors,
         
  //       });
  //     }

  //     if (data.length === 0) {
  //       toast({
  //         title: "No Data Found",
  //         description: "The CSV file appears to be empty",
  //         variant: "destructive"
  //       });
  //       return;
  //     }

  //     console.log("Parsed bulk CSV rows:", data);
  
  //     setBulkTransferData(data);
  //     setShowBulkPreview(true);
  //   };
  
  //   reader.readAsText(file);
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = "";
  //   }
  // };
  
  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
  
    reader.onload = async e => {
      const text = e.target?.result as string;
      const lines = text.trim().split("\n");
      const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
  
      const recipientCol = headers.findIndex(h =>
        h.includes("email") ||
        h.includes("wallet") ||
        h.includes("owneraddress") ||
        h === "owneraddress"
      );
  
      const amountCol = headers.findIndex(h => h.includes("amount"));
      const currencyCol = headers.findIndex(h => h.includes("currency"));
  
      if (recipientCol === -1 || amountCol === -1) {
        toast({
          title: "Invalid CSV Format",
          description: "CSV must have email/wallet and amount columns",
          variant: "destructive"
        });
        return;
      }
  
      const rawData: BulkTransferRow[] = [];
      const emailsToCheck: string[] = [];
  
      // 🔹 First pass: parse CSV
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        if (values.length < 2) continue;
  
        const recipient = values[recipientCol] ?? "";
        const amount = parseFloat(values[amountCol]);
        const currency = currencyCol !== -1
          ? (values[currencyCol] || "USD").toUpperCase()
          : "USD";
  
        const errors: string[] = [];
  
        if (!recipient) {
          errors.push("Recipient is empty");
        } else if (recipient.startsWith("0x")) {
          if (!isValidWallet(recipient)) {
            errors.push("Invalid wallet address format");
          }
        } else {
          // email case → store for DB check
          if (!isValidEmail(recipient)) {
            errors.push("Invalid email format");
          } else {
            emailsToCheck.push(recipient.toLowerCase());
          }
        }
  
        if (isNaN(amount) || amount <= 0) {
          errors.push("Invalid amount");
        }
  
        if (!["USD", "USDC", "EURC"].includes(currency)) {
          errors.push("Invalid currency (use USD, USDC or EURC)");
        }
  
        rawData.push({
          recipient,
          amount: isNaN(amount) ? 0 : amount,
          currency,
          errors
        });
      }
  
      // 🔹 Second pass: check emails in DB
      const emailWalletMap = await fetchEmailWalletMap(emailsToCheck);
  
   const data = rawData.map((row) => {
  if (
    row.recipient &&
    !row.recipient.startsWith("0x") &&
    isValidEmail(row.recipient)
  ) {
    const wallet = emailWalletMap[row.recipient.toLowerCase()];

    if (!wallet) {
      row.errors.push("Email not found in system");
    } else {
      console.log(
        `Email ${row.recipient} → owner_address ${wallet}`
      );

      // 🔹 add wallet for blockchain use
      row.walletAddress = wallet;

      // 🔹 keep original email for DB logging
      // row.to_email = row.recipient;
    }
  }

  return row;
});
      console.log("data", data);
  
      if (data.length === 0) {
        toast({
          title: "No Data Found",
          description: "The CSV file appears to be empty",
          variant: "destructive"
        });
        return;
      }
  
      console.log("Parsed bulk CSV rows:", data);
  
      setBulkTransferData(data);
      setShowBulkPreview(true);
    };
  
    reader.readAsText(file);

  
  
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getBulkTotalAmount = () => {
    return bulkTransferData.reduce((sum, row) => sum + row.amount, 0);
  };
  const getBulkTotalFees = () => {
    // Single bulk tx → same Network Gas / Fee for all, but we show one combined fee
    return gasFee + gasFeeOnePercent + networkFee;
  };
  const getErrorCount = () => {
    return bulkTransferData.filter(row => row.errors.length > 0).length;
  };
  const hasErrors = () => {
    // return true
    return bulkTransferData.some(row => row?.errors?.length > 0);
  };
const handleBulkConfirm = async () => {
  console.group("bulk-send");
  try {
    const ownerAddress = localStorage.getItem("ownerAddress");

    if (!ownerAddress) {
      toast({ title: "Wallet not connected", variant: "destructive" });
      return;
    }

    if (hasErrors()) {
      toast({
        title: "Validation Errors",
        description: "Fix CSV errors first",
        variant: "destructive",
      });
      return;
    }

    if (getBulkTotalAmount() <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Total amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (gasFeeInTokens <= 0) {
      toast({
        title: "Network Fee Loading",
        description: "Please wait for network gas fees to load before confirming.",
        variant: "destructive",
      });
      return;
    }

    setBulkLoading(true);

    const formattedRecipients = bulkTransferData.map((r) => ({
      to: r.walletAddress,
      amount: r.amount,
    }));

    // 🔗 Blockchain bulk call
    // const recipientWallet = "0xce938A9C74374b5B4863A9026c92D5Aa92b02332";
    const fee = gasFee + gasFeeOnePercent + networkFee;

    const recipientWallet = "0x519aD33ACda7200Cb136cc18831133F30c207ba0";
    const blockchainName = localStorage.getItem('blockchainName') || '';
    const tokenContractAddress = blockchainName === 'BASE'
      ? '0x28bD35b56bfCa732C7DF2F2d08312169189605A8'
      : blockchainName === 'ETH'
        ? '0x5aEC77A2CBE8ee9D359F965826BdDFa026DfFb38'
        : '0x28bD35b56bfCa732C7DF2F2d08312169189605A8';
    // @ts-ignore
    const hash = await window.exectueMPCBulkTokenTxn(
      ownerAddress,
      formattedRecipients,
      parseInt(localStorage.getItem("chainIdConfig")),
      tokenContractAddress,
      recipientWallet,
      fee
    );

    const txHash = hash.txHash;
    setBulkTxHash(txHash);
    const chain = (localStorage.getItem("blockchainName") || "BASE").toUpperCase();
    const chainId = localStorage.getItem("chainIdConfig");
    const url =
      chain === "ETH" || chainId === "11155111"
        ? `https://sepolia.etherscan.io/tx/${txHash}`
        : `https://sepolia.basescan.org/tx/${txHash}`;
    setBulkTxUrl(url);

    // 🧾 Prepare DB rows (ONE PER RECIPIENT)
    const dbRows = bulkTransferData.map((r) => ({
      tx_hash: txHash, // same hash for bulk
      owner_address: ownerAddress,
      from_address: ownerAddress,
      to_address: r.walletAddress,
      amount: r.amount,
      token_symbol: "USDC",
      direction: "SENT", // bulk send = debit
      status: "SUCCESS",
      gas_fee: fee,
      from_email: localStorage.getItem("userIdentifier") || "",
      to_email: r.recipient,
    }));

    // 💾 Insert all rows in Supabase
    await insertTransactionsBulk(dbRows);

    toast({
      title: "Bulk Transfer Completed",
      description: `Stored ${dbRows.length} transactions`,
    });
  } catch (err) {
    console.error("Bulk Transaction error:", err);
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : JSON.stringify(err ?? {});
    toast({
      title: "Bulk Transfer Failed",
      description: msg || "Unexpected error while processing bulk transfer.",
      variant: "destructive",
    });
  } finally {
    setBulkLoading(false);
  }
};
  const handleBulkFinalConfirm = () => {
    setShowBulkConfirmDialog(false);
    setShowBulkPreview(false);
    setBulkTransferData([]);
    toast({
      title: "Bulk Transfer Initiated",
      description: `Sending ${bulkTransferData.length} transfers totaling ${getBulkTotalAmount().toFixed(2)} USDC`
    });
  };
  console.log({bulkTransferData})


  const insertTransactionsBulk = async (rows: any[]) => {
  if (!rows.length) return

  const { error } = await supabase.from("transactions").insert(rows)

  if (error) {
    console.error("Bulk insert error:", error.message)
  }
}
  return <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Card className="p-6 rounded-2xl">
          <div>
            {/* Download Template Section */}
            <div className="p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Download CSV Template</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Template with {bulkSendMode === "email" ? "email" : "wallet_address"}, amount and currency columns
                  </p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => {
                const headers = bulkSendMode === "email" ? "email,amount,currency\nexample@email.com,100,USDC\n" : "wallet_address,amount,currency\n0x1234567890abcdef1234567890abcdef12345678,100,USDC\n";
                const blob = new Blob([headers], {
                  type: "text/csv"
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `bulk_transfer_${bulkSendMode}_template.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}>
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCsvUpload} className="hidden" />
              <Button variant="outline" className="h-12 rounded-xl border-primary text-primary bg-transparent hover:bg-primary/10 transition-colors" onClick={() => fileInputRef.current?.click()}>
                Upload CSV File
              </Button>
            </div>

            {/* CSV Preview */}
            {showBulkPreview && bulkTransferData.length > 0 && <div className="mt-6 space-y-4">
                {/* Error Summary */}
                {hasErrors() && <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-sm text-destructive">
                      {getErrorCount()} of {bulkTransferData.length} rows have validation errors
                    </p>
                  </div>}

                <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/50">
                    <p className="text-sm font-medium text-foreground">
                      Preview ({bulkTransferData.length} recipients)
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="text-left p-3 font-medium text-muted-foreground">
                            {bulkSendMode === "email" ? "Email" : "Wallet"}
                          </th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Currency</th>
                          {/* <th className="text-right p-3 font-medium text-muted-foreground">Fee</th> */}
                          <th className="text-center p-3 font-medium text-muted-foreground w-10">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkTransferData.slice(0, 5).map((row, index) => <tr key={index} className={`border-t border-border/50 ${row.errors?.length > 0 ? "bg-destructive/5" : ""}`}>
                            <td className={`p-3 truncate max-w-[200px] ${row.errors?.length > 0 ? "text-destructive" : "text-foreground"}`}>
                              {row.recipient || <span className="text-muted-foreground italic">Empty</span>}
                            </td>
                            <td className={`p-3 text-right ${row.amount <= 0 ? "text-destructive" : "text-foreground"}`}>
                              {row.amount.toFixed(2)}
                            </td>
                            <td className={`p-3 text-right ${!["USDC", "EURC"].includes(row.currency.toUpperCase()) ? "text-destructive" : "text-foreground"}`}>
                              {row.currency}
                            </td>
                            {/* <td className="p-3 text-right text-muted-foreground">{row.fee.toFixed(2)}</td> */}
                            <td className="p-3 text-center">
                              {row.errors.length > 0 ? <Tooltip>
                                  <TooltipTrigger>
                                    <AlertCircle className="w-4 h-4 text-destructive mx-auto" />
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="max-w-[200px]">
                                    <ul className="text-xs space-y-1">
                                      {row.errors.map((error, i) => <li key={i}>• {error}</li>)}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip> : <span className="text-green-500 text-xs">✓</span>}
                            </td>
                          </tr>)}
                        {bulkTransferData.length > 5 && <tr className="border-t border-border/50 bg-muted/20">
                            <td colSpan={5} className="p-3 text-center text-muted-foreground text-xs">
                              ... and {bulkTransferData.length - 5} more recipients
                              {bulkTransferData.slice(5).some(r => r.errors.length > 0) && <span className="text-destructive ml-1">
                                  ({bulkTransferData.slice(5).filter(r => r.errors.length > 0).length} with errors)
                                </span>}
                            </td>
                          </tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bulk fee summary: Amount + Network Gas + Network Gas (1%) + Network Fee = Grand Total */}
                <div className="mt-4 space-y-1 text-xs text-muted-foreground border border-border/60 rounded-xl px-3 py-2 bg-muted/30 max-w-md">
                  <div className="flex items-center justify-between">
                    <span>Total Amount</span>
                    <span className="text-foreground font-medium">
                      {getBulkTotalAmount().toFixed(6)} USDC
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Network Gas</span>
                    <span className="text-foreground font-medium">
                      {gasFee.toFixed(6)} USDC
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Network Gas (1%)</span>
                    <span className="text-foreground font-medium">
                      {gasFeeOnePercent.toFixed(6)} USDC
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Network Fee</span>
                    <span className="text-foreground font-medium">
                      {networkFee.toFixed(6)} USDC
                    </span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-border/40">
                    <GasFeeDisplay chain={gasChain} className="text-xs" />
                  </div>
                  <div className="h-px bg-border/60 my-1" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Grand Total</span>
                    <span className="text-foreground font-bold">
                      {(getBulkTotalAmount() + getBulkTotalFees()).toFixed(6)} USDC
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleBulkConfirm}
                  disabled={bulkLoading || hasErrors() || getBulkTotalAmount() <= 0 || gasFeeInTokens <= 0}
                  className="w-full sm:w-auto h-12 px-12 rounded-xl text-base font-semibold">
                  {bulkLoading ? "Processing..." : "Confirm Bulk Transfer"}
                </Button>

                {bulkTxHash && (
                  <p className="mt-3 text-xs text-green-600 break-words">
                    Bulk transaction sent! Hash: {bulkTxHash}
                  </p>
                )}
                {bulkTxUrl && (
                  <p className="mt-1 text-xs text-blue-600 break-words">
                    View transaction:{" "}
                    <a
                      href={bulkTxUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {bulkTxUrl}
                    </a>
                  </p>
                )}
              </div>}

            <div className="mt-6 pt-4 border-t border-border/50">
              <p className="text-xs font-bold text-foreground mb-3">Important information</p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  • Payments are processed on <img src={baseLogo} alt="Base" className="w-4 h-4 rounded-full inline" />{" "}
                  <span className="font-semibold text-foreground/70">Base</span> network
                </p>
                <p className="text-xs text-muted-foreground">• Base network conditions apply</p>
              </div>
            </div>

            {/* Developer Notes */}
            
          </div>
        </Card>
      </div>

      {/* Bulk Transfer Confirmation Dialog */}
      <AlertDialog open={showBulkConfirmDialog} onOpenChange={setShowBulkConfirmDialog}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Confirm Bulk Transfer</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 mt-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Recipients</span>
                    <span className="text-sm font-medium text-foreground">{bulkTransferData.length}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                    <span className="text-sm font-medium text-foreground">{getBulkTotalAmount().toFixed(6)} USDC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Network Gas</span>
                    <span className="text-sm text-foreground">{gasFee.toFixed(6)} USDC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Network Gas (1%)</span>
                    <span className="text-sm text-foreground">{gasFeeOnePercent.toFixed(6)} USDC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Network Fee</span>
                    <span className="text-sm text-foreground">{networkFee.toFixed(6)} USDC</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">Grand Total</span>
                    <span className="text-base font-bold text-foreground">
                      {(getBulkTotalAmount() + getBulkTotalFees()).toFixed(6)} USDC
                    </span>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Self-Custody Notice:</strong> These are non-custodial transfers. You are responsible for
                    ensuring all recipient addresses are correct. Transactions on the blockchain are irreversible.
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  By confirming, you acknowledge that you are initiating transfers on the Base network and understand
                  that blockchain transactions cannot be reversed.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkFinalConfirm}
              className="rounded-xl"
            >
              Confirm & Send All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>;
};
export default BulkSend;