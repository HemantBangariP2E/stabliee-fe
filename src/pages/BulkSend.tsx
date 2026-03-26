import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import baseLogo from "@/assets/base-logo.png";
import { getConnectedNetworkDisplay } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/hooks/supabaseClient";
import { getAccountChainId } from "@/lib/accountScope";
import { GasFeeDisplay } from "@/components/GasFeeDisplay";

interface BulkTransferRow {
  recipient: string;
  amount: string;
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

/** Same ratio as GasFeeDisplay single-tx gas (65k) vs typical bulk envelope. */
const BULK_BASE_GAS_UNITS = 65_000;
const BULK_BASE_OVERHEAD = 120_000;
const BULK_PER_RECIPIENT_GAS = 35_000;

function bulkGasUsdScale(recipientCount: number): number {
  if (recipientCount <= 0) return 1;
  const units = BULK_BASE_OVERHEAD + Math.max(0, recipientCount - 1) * BULK_PER_RECIPIENT_GAS;
  return units / BULK_BASE_GAS_UNITS;
}

/** Show exact amount - e.g. 0.000000001 stays as-is, 100 shows without trailing zeros */
function formatExactAmount(n: number): string {
  return n.toFixed(18).replace(/\.?0+$/, "");
}

const BulkSend = () => {
  const navigate = useNavigate();
  const [bulkSendMode, setBulkSendMode] = useState<"email" | "wallet">("email");
  const [bulkTransferData, setBulkTransferData] = useState<BulkTransferRow[]>([]);
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [showBulkConfirmDialog, setShowBulkConfirmDialog] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkTxHash, setBulkTxHash] = useState("");
  const [bulkTxUrl, setBulkTxUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feePercent = 0.01; // 1% of bulk gas (USD)
  const [gasFeeBaseUSD, setGasFeeBaseUSD] = useState(0);
  const gasChain = getGasChain();
  const connectedNetwork = getConnectedNetworkDisplay();

  const n = bulkTransferData.length;
  const bulkGasUSD =
    n > 0 ? Math.round(gasFeeBaseUSD * bulkGasUsdScale(n) * 1e6) / 1e6 : 0;
  const platformFeeUSD = bulkGasUSD * feePercent;
  const bulkTotalFeesUSD = bulkGasUSD + platformFeeUSD;

  const handleGasUsdUpdate = useCallback((usd: number) => {
    setGasFeeBaseUSD(usd);
  }, []);


const fetchEmailWalletMap = async (emails: string[]) => {
  if (!emails.length) return {};

  const chainId = getAccountChainId();
  const { data, error } = await supabase
    .from("user_logins")
    .select("user_identifier, owner_address")
    .in("user_identifier", emails)
    .eq("chain_id", chainId);

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
        const values = lines[i].split(",").map(v => (v ?? "").toString().trim());
        if (values.length < 2) continue;

        const recipient = (values[recipientCol] ?? "").toString().trim() || "";
        const amount = (values[amountCol] ?? "").toString().trim() || "";
        const currency = currencyCol !== -1
          ? ((values[currencyCol] ?? "").toString().trim() || "USDC").toUpperCase()
          : "USDC";

        const errors: string[] = [];

        if (!recipient) {
          errors.push("Recipient is empty");
        } else if (recipient.startsWith("0x")) {
          if (!isValidWallet(recipient)) {
            errors.push("Invalid wallet address format");
          }
        } else {
          if (!isValidEmail(recipient)) {
            errors.push("Invalid email format");
          } else {
            emailsToCheck.push(recipient.toLowerCase());
          }
        }

        if (!amount || amount.includes("e") || amount.includes("E") || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
          errors.push("Invalid amount");
        }

        if (currency !== "USDC") {
          errors.push("Invalid currency (only USDC is supported)");
        }

        rawData.push({
          recipient,
          amount: errors.some(e => e === "Invalid amount") ? "" : amount,
          currency,
          errors
        });
      }
  
      // 🔹 Second pass: check emails in DB
      const emailWalletMap = await fetchEmailWalletMap(emailsToCheck);
  
   const data = rawData.map((row) => {
  if (row.recipient && row.recipient.startsWith("0x") && isValidWallet(row.recipient)) {
    row.walletAddress = row.recipient;
  } else if (
    row.recipient &&
    !row.recipient.startsWith("0x") &&
    isValidEmail(row.recipient)
  ) {
    const wallet = emailWalletMap[row.recipient.toLowerCase()];

    if (!wallet) {
      row.errors!.push("Email not found in system");
    } else {
      row.walletAddress = wallet;
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

  const getBulkTotalAmount = (): number => {
    return bulkTransferData.reduce((sum, row) => {
      const amt = (row.amount ?? "").toString().trim();
      if (!amt || amt.includes("e") || amt.includes("E")) return sum;
      const n = Number(amt);
      return sum + (Number.isNaN(n) || n <= 0 ? 0 : n);
    }, 0);
  };
  const getBulkTotalFees = () => bulkTotalFeesUSD;
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

    if (gasFeeBaseUSD <= 0 || bulkGasUSD <= 0) {
      toast({
        title: "Network Fee Loading",
        description: "Please wait for network gas fees to load before confirming.",
        variant: "destructive",
      });
      return;
    }

    setBulkLoading(true);

    const formattedRecipients = bulkTransferData.map((r) => {
      const amountToSend = (r.amount ?? "").toString().trim();
      if (!amountToSend) {
        throw new Error(`Amount missing for recipient ${r.recipient || r.walletAddress}`);
      }
      if (amountToSend.includes("e") || amountToSend.includes("E")) {
        throw new Error(`Invalid decimal format (no scientific notation) for ${r.recipient || r.walletAddress}`);
      }
      if (Number.isNaN(Number(amountToSend)) || Number(amountToSend) <= 0) {
        throw new Error(`Invalid amount for ${r.recipient || r.walletAddress}`);
      }
      return {
        to: r.walletAddress ?? "",
        amount: amountToSend,
      };
    });

    // 🔗 Blockchain bulk call
    // const recipientWallet = "0xce938A9C74374b5B4863A9026c92D5Aa92b02332";
    const fee = bulkTotalFeesUSD;

    const feeChainId = localStorage.getItem("chainIdConfig") || "";
    const blockchainName = (localStorage.getItem('blockchainName') || '').toUpperCase();
    const isEthChainForFee = blockchainName === "ETH" || feeChainId === "1" || feeChainId === "11155111";
    const recipientWallet = isEthChainForFee
      ? "0xaAEd3fCdDEDA26F9AD0582698d9Be012e48D88aF"
      : "0x3eF4Bd3948976bD4Af03003E5bC0e109E016d563";
    const tokenContractAddress = blockchainName === 'BASE'
      ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      : blockchainName === 'ETH'
        ? (feeChainId === "1" ? "0xfE9F09aa5b416b5A83bD9387A99Fc7b1185e3D2A" : "0x5aEC77A2CBE8ee9D359F965826BdDFa026DfFb38")
        : '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
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
    const explorerChainId = localStorage.getItem("chainIdConfig") || "";
    const isMainnet = explorerChainId === "1" || explorerChainId === "8453";
    const url =
      chain === "ETH" || explorerChainId === "11155111" || explorerChainId === "1"
        ? (isMainnet ? `https://etherscan.io/tx/${txHash}` : `https://sepolia.etherscan.io/tx/${txHash}`)
        : (isMainnet ? `https://basescan.org/tx/${txHash}` : `https://sepolia.basescan.org/tx/${txHash}`);
    setBulkTxUrl(url);
    navigate("/activity", { state: { fromSend: true } });

    // 🧾 Prepare DB rows (ONE PER RECIPIENT)
    const chainId = localStorage.getItem("chainIdConfig") || "";
    const dbRows = bulkTransferData.map((r, i) => ({
      tx_hash: txHash, // same hash for bulk
      owner_address: ownerAddress,
      from_address: ownerAddress,
      to_address: r.walletAddress,
      amount: formattedRecipients[i].amount,
      token_symbol: "USDC",
      direction: "SENT", // bulk send = debit
      status: "SUCCESS",
      gas_fee: fee,
      from_email: localStorage.getItem("userIdentifier") || "",
      to_email: r.recipient,
      chain_id: chainId,
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
      description: `Sending ${bulkTransferData.length} transfers totaling ${formatExactAmount(getBulkTotalAmount())} USDC`
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
                            <td className={`p-3 text-right ${!row.amount || Number(row.amount) <= 0 ? "text-destructive" : "text-foreground"}`}>
                              {row.amount || "—"}
                            </td>
                            <td className={`p-3 text-right ${row.currency?.toUpperCase() !== "USDC" ? "text-destructive" : "text-foreground"}`}>
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

                {/* Bulk fee summary: Total Amount + Network Gas + Network Gas (1%) = Grand Total */}
                <div className="mt-4 space-y-1 text-xs text-muted-foreground border border-border/60 rounded-xl px-3 py-2 bg-muted/30 max-w-md">
                  <div className="flex items-center justify-between">
                    <span>Total Amount</span>
                    <span className="text-foreground font-medium">
                      {formatExactAmount(getBulkTotalAmount())} USDC
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gas Fee (bulk est.)</span>
                    <span className="text-foreground font-medium">
                      ${bulkGasUSD.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Platform fee</span>
                    <span className="text-foreground font-medium">
                      ${platformFeeUSD.toFixed(6)}
                    </span>
                  </div>
                  {/* <div className="flex items-center justify-between">
                    <span>Network Fee</span>
                    <span className="text-foreground font-medium">
                      {networkFee.toFixed(6)} USDC
                    </span>
                  </div> */}
                  <div className="pt-2 mt-2 border-t border-border/40">
                    <GasFeeDisplay
                      chain={gasChain}
                      className="text-xs"
                      onGasUpdate={handleGasUsdUpdate}
                    />
                  </div>
                  <div className="h-px bg-border/60 my-1" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Grand Total</span>
                    <span className="text-foreground font-bold">
                      {formatExactAmount(getBulkTotalAmount() + getBulkTotalFees())} USDC
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleBulkConfirm}
                  disabled={
                    bulkLoading ||
                    hasErrors() ||
                    getBulkTotalAmount() <= 0 ||
                    gasFeeBaseUSD <= 0 ||
                    bulkTransferData.length === 0
                  }
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
                  • Payments are processed on{" "}
                  {connectedNetwork.isBase ? (
                    <><img src={baseLogo} alt="Base" className="w-4 h-4 rounded-full inline" />{" "}</>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-muted-foreground/20 inline-flex items-center justify-center text-[10px] font-bold">Ξ</span>
                  )}{" "}
                  <span className="font-semibold text-foreground/70">{connectedNetwork.name}</span> network
                </p>
                <p className="text-xs text-muted-foreground">• {connectedNetwork.name} network conditions apply</p>
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
                    <span className="text-sm font-medium text-foreground">{formatExactAmount(getBulkTotalAmount())} USDC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gas Fee (bulk est.)</span>
                    <span className="text-sm text-foreground">${bulkGasUSD.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Platform fee</span>
                    <span className="text-sm text-foreground">${platformFeeUSD.toFixed(6)}</span>
                  </div>
                  {/* <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Network Fee</span>
                    <span className="text-sm text-foreground">{networkFee.toFixed(6)} USDC</span>
                  </div> */}
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">Grand Total</span>
                    <span className="text-base font-bold text-foreground">
                      {formatExactAmount(getBulkTotalAmount() + getBulkTotalFees())} USDC
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