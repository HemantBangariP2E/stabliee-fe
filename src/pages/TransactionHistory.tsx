import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ArrowUpDown, Copy, Send, TrendingUp, TrendingDown, X, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/hooks/supabaseClient";
import {
  getAllTransactions,
  clearTransferCache,
  isPlatformFeeTransfer,
  isPlatformFeeOwnerAddress,
  transferDedupeKey,
} from "@/lib/alchemy";
import type { AlchemyNetwork } from "@/lib/alchemy";

type Transaction = {
  id: number;
  transactionId: string;
  batchId: string | null;
  date: string;
  type: string;
  fromEmail: string;
  toEmail: string;
  amount: string;
  address: string;
  status: string;
  gasFee: string;
};



const TOKEN_ADDRESSES: Record<string, string> = {
  "11155111": "0x5aEC77A2CBE8ee9D359F965826BdDFa026DfFb38",
  "1": "0xfE9F09aa5b416b5A83bD9387A99Fc7b1185e3D2A",
  "84532": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};
const CHAIN_TO_NETWORK: Record<string, AlchemyNetwork> = {
  "11155111": "eth-sepolia",
  "1": "eth-mainnet",
  "84532": "base-sepolia",
  "8453": "base-mainnet",
};

function formatAddress(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDateUTC(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString("en-US", { timeZone: "UTC", dateStyle: "short", timeStyle: "medium" }) + " UTC";
}

function getExplorerUrl(txHash: string): string {
  const chainId = localStorage.getItem("chainIdConfig") || "";
  const blockchainName = (localStorage.getItem("blockchainName") || "BASE").toUpperCase();
  const isMainnet = chainId === "1" || chainId === "8453";
  if (blockchainName === "ETH") {
    return isMainnet
      ? `https://etherscan.io/tx/${txHash}`
      : `https://sepolia.etherscan.io/tx/${txHash}`;
  }
  return isMainnet
    ? `https://basescan.org/tx/${txHash}`
    : `https://sepolia.basescan.org/tx/${txHash}`;
}

async function fetchEmailsForAddresses(
  addresses: string[],
  chainId: string
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(addresses.filter((a) => a && a.startsWith("0x")))];
  if (unique.length === 0) return map;
  const orFilter = unique.map((a) => `owner_address.ilike.${a}`).join(",");
  let q = supabase
    .from("user_logins")
    .select("user_identifier, owner_address")
    .or(orFilter);
  if (chainId) q = q.eq("chain_id", chainId);
  const { data, error } = await q;
  if (error) {
    console.error("fetchEmailsForAddresses error:", error.message);
    return map;
  }
  for (const row of data ?? []) {
    if (row.owner_address && row.user_identifier) {
      map.set(String(row.owner_address).toLowerCase(), row.user_identifier);
    }
  }
  return map;
}

const TransactionHistory = () => {
  const location = useLocation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [filterType, setFilterType] = useState<"all" | "send" | "receive">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed" | "pending">("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [networkVersion, setNetworkVersion] = useState(0);
  const chainKey =
    typeof window !== "undefined"
      ? `${localStorage.getItem("chainIdConfig") ?? ""}_${localStorage.getItem("blockchainName") ?? ""}_${networkVersion}`
      : "";

  useEffect(() => {
    const ethereum = (window as { ethereum?: { on?: (e: string, h: () => void) => void; removeListener?: (e: string, h: () => void) => void } }).ethereum;
    const onChainChanged = () => setNetworkVersion((v) => v + 1);
    ethereum?.on?.("chainChanged", onChainChanged);
    return () => {
      ethereum?.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  useEffect(() => {
    const fetchTransactions = async (silent = false) => {
      const ownerAddress = localStorage.getItem("ownerAddress");
      const chainId = localStorage.getItem("chainIdConfig") || "";
      const tokenLabel = chainId === "11155111" || chainId === "1" ? "USDT" : "USDC";
      const alchemyNetwork = CHAIN_TO_NETWORK[chainId];
      const tokenAddress = TOKEN_ADDRESSES[chainId] ?? TOKEN_ADDRESSES["84532"];

      if (!ownerAddress) return;

      if (!silent) setLoading(true);
      clearTransferCache();

      const supabasePromise = supabase
        .from("transactions")
        .select("*")
        .or(`owner_address.ilike.${ownerAddress},to_address.ilike.${ownerAddress}`)
        .eq("chain_id", chainId)
        .order("created_at", { ascending: false });

      const alchemyPromise = alchemyNetwork
        ? getAllTransactions(ownerAddress, tokenAddress, alchemyNetwork).catch((err) => {
            console.error("[TransactionHistory] Kalp token-transfers fetch error:", err);
            return [];
          })
        : Promise.resolve([]);

      const [supabaseResult, alchemyTransfers] = await Promise.all([
        supabasePromise,
        alchemyPromise,
      ]);

      const { data: supabaseData, error } = supabaseResult;

      if (error) {
        console.error("Fetch tx error:", error.message);
      }

      const supabaseRows = (supabaseData ?? []).filter(
        (tx: { owner_address?: string }) => !isPlatformFeeOwnerAddress(tx.owner_address)
      );

      const supabaseAddresses: string[] = [];
      for (const tx of supabaseRows) {
        if ((!tx.from_email || tx.from_email === "N/A") && tx.from_address) {
          supabaseAddresses.push(tx.from_address);
        }
        if ((!tx.to_email || tx.to_email === "N/A") && tx.to_address) {
          supabaseAddresses.push(tx.to_address);
        }
      }
      const alchemyAddresses = [
        ...new Set(alchemyTransfers.flatMap((t) => [t.from, t.to]).filter(Boolean)),
      ];
      const allAddresses = [...new Set([...supabaseAddresses, ...alchemyAddresses])];
      const addressToEmail = await fetchEmailsForAddresses(allAddresses, chainId);

      const resolveDisplay = (addr: string) =>
        addressToEmail.get(addr?.toLowerCase()) ?? (addr ? formatAddress(addr) : "N/A");

      const ownerLower = ownerAddress.toLowerCase();
      const mapped = supabaseRows.map((tx: any, index: number): Transaction => {
        const fromEmail =
          tx.from_email && tx.from_email !== "N/A"
            ? tx.from_email
            : tx.from_address
              ? resolveDisplay(tx.from_address)
              : "N/A";
        const toEmail =
          tx.to_email && tx.to_email !== "N/A"
            ? tx.to_email
            : tx.to_address
              ? resolveDisplay(tx.to_address)
              : "N/A";
        const isUserSender = String(tx.owner_address || "").toLowerCase() === ownerLower;
        const dbDirection = tx.direction === "SENT" ? "Send" : tx.direction === "RECEIVE" ? "Receive" : "Send";
        const type = isUserSender ? dbDirection : dbDirection === "Send" ? "Receive" : "Send";
        const t: Transaction = {
          id: index + 1,
          transactionId: tx.tx_hash,
          batchId: tx.batch_id || null,
            date: formatDateUTC(tx.created_at),
          type,
          fromEmail,
          toEmail,
          amount: `${Number(tx.amount).toFixed(8)} ${tx.token_symbol}`,
          address: tx.to_address,
          status:
            tx.status === "SUCCESS" ? "Success" : tx.status === "FAILED" ? "Failed" : "Pending",
          gasFee:
            tx.gas_fee !== null
              ? `${Number(tx.gas_fee).toFixed(8)} ${tx.token_symbol}`
              : "N/A",
        };
        return t;
      });

      const seenTransferKeys = new Set<string>();
      for (const tx of supabaseRows) {
        seenTransferKeys.add(transferDedupeKey(tx.tx_hash, tx.to_address));
      }

      const sortTimeByKey = new Map<string, number>();
      for (const d of supabaseRows) {
        sortTimeByKey.set(
          transferDedupeKey(d.tx_hash, d.to_address),
          new Date(d.created_at).getTime()
        );
      }

      const alchemyTransfersWithoutFeeLegs = alchemyTransfers.filter((t) => !isPlatformFeeTransfer(t));

      let nextId = mapped.length + 1;
      for (const t of alchemyTransfersWithoutFeeLegs) {
        const dedupeKey = transferDedupeKey(t.hash, t.to);
        if (seenTransferKeys.has(dedupeKey)) continue;
        seenTransferKeys.add(dedupeKey);
        const isSent = t.from.toLowerCase() === ownerLower;
        const otherAddr = isSent ? t.to : t.from;
        const sortTime = t.blockTimestamp
          ? new Date(t.blockTimestamp).getTime()
          : t.blockNum
            ? parseInt(t.blockNum, 16) * 12_000
            : 0;
        sortTimeByKey.set(dedupeKey, sortTime);
        const alchemyTx: Transaction = {
          id: nextId++,
          transactionId: t.hash,
          batchId: null,
          date: t.blockTimestamp
            ? formatDateUTC(t.blockTimestamp)
            : `Block ${t.blockNum ? parseInt(t.blockNum, 16) : "?"}`,
          type: isSent ? "Send" : "Receive",
          fromEmail: resolveDisplay(t.from),
          toEmail: resolveDisplay(t.to),
          amount: `${t.amount.toFixed(8)} ${tokenLabel}`,
          address: otherAddr,
          status: "Success",
          gasFee: "N/A",
        };
        mapped.push(alchemyTx);
      }

      const sortKey = (row: Transaction) =>
        transferDedupeKey(row.transactionId, row.address);

      mapped.sort(
        (a, b) => (sortTimeByKey.get(sortKey(b)) ?? 0) - (sortTimeByKey.get(sortKey(a)) ?? 0)
      );

      setTransactions(mapped);
      setLoading(false);
    };

    fetchTransactions();

    const fromSend = Boolean((location.state as { fromSend?: boolean } | null)?.fromSend);
    const retryIds: ReturnType<typeof setTimeout>[] = [];
    if (fromSend) {
      retryIds.push(setTimeout(() => void fetchTransactions(true), 1500));
      retryIds.push(setTimeout(() => void fetchTransactions(true), 4000));
    }

    return () => {
      retryIds.forEach(clearTimeout);
    };
  }, [chainKey, location.key]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Send":
        return <Send className="w-5 h-5 text-primary" />;
      case "Receive":
        return <Send className="w-5 h-5 text-success rotate-180" />;
      case "Buy":
        return <TrendingUp className="w-5 h-5 text-success" />;
      case "Sell":
        return <TrendingDown className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getNameIcon = (name: string) => {
    if (!name || name === "N/A" || name === "External Wallet" || name === "Bank Transfer" || name === "Bank Withdrawal" || name === "Card Purchase") {
      return <HelpCircle className="w-5 h-5 text-muted-foreground" />;
    }
    return <span className="text-sm font-semibold text-foreground">{name.charAt(0).toUpperCase()}</span>;
  };

  const formatAmountForList = (amount: string) => {
    const parts = amount.split(" ");
    const value = parseFloat(parts[0]);
    return Number.isFinite(value) ? value.toFixed(6) : "0.000000";
  };

  const parseTxDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr.startsWith("Block ")) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const filteredTransactions = transactions.filter((tx) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      tx.fromEmail.toLowerCase().includes(query) ||
      tx.toEmail.toLowerCase().includes(query) ||
      tx.transactionId.toLowerCase().includes(query) ||
      tx.address?.toLowerCase().includes(query) ||
      (tx.batchId && tx.batchId.toLowerCase().includes(query));

    const matchesType =
      filterType === "all" ||
      (filterType === "send" && tx.type === "Send") ||
      (filterType === "receive" && tx.type === "Receive");

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "success" && tx.status === "Success") ||
      (filterStatus === "failed" && tx.status === "Failed") ||
      (filterStatus === "pending" && tx.status === "Pending");

    let matchesDate = true;
    if (startDate || endDate) {
      const txDate = parseTxDate(tx.date);
      if (txDate) {
        const txDayStart = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
        if (startDate) {
          const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          if (txDayStart < start) matchesDate = false;
        }
        if (endDate && matchesDate) {
          const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
          if (txDayStart > end) matchesDate = false;
        }
      } else {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  return (

    
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        <Card className="p-4 md:p-6 rounded-2xl">
          {/* <div className="mb-4">
            <AlchemyTotalsCard />
          </div> */}
          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search email, txn ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full md:w-72 h-10 rounded-xl"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <span className="text-sm text-muted-foreground hidden md:inline">Filter</span>
              <div className="hidden md:flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 rounded-lg gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">To</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 rounded-lg gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {endDate ? format(endDate, "MMM d, yyyy") : "End Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {(startDate || endDate) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setStartDate(undefined);
                      setEndDate(undefined);
                    }}
                    title="Clear date filter"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <Select
                value={filterType}
                onValueChange={(value) =>
                  setFilterType(value as "all" | "send" | "receive")
                }
              >
                <SelectTrigger className="w-24 md:w-28 h-9 rounded-lg">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Type</SelectItem>
                  <SelectItem value="send">Send</SelectItem>
                  <SelectItem value="receive">Receive</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterStatus}
                onValueChange={(value) =>
                  setFilterStatus(value as "all" | "success" | "failed" | "pending")
                }
              >
                <SelectTrigger className="w-24 md:w-28 h-9 rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading && (
            <p className="text-sm text-muted-foreground p-4">
              Loading transactions...
            </p>
          )}

          {!loading && filteredTransactions.length === 0 && (
            <p className="text-sm text-muted-foreground p-4">
              No transactions found.
            </p>
          )}

          {!loading && filteredTransactions.length > 0 && (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block border border-border rounded-xl overflow-hidden">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[14.28%]" />
                    <col className="w-[14.28%]" />
                    <col className="w-[14.28%]" />
                    <col className="w-[14.28%]" />
                    <col className="w-[14.28%]" />
                    <col className="w-[14.28%]" />
                    <col className="w-[14.28%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border bg-muted/30 h-12">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">From email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">To email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">TX Hash</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      {/* <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTransaction(tx)}
                        className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors cursor-pointer h-14"
                      >
                        <td className="py-3 px-4 text-sm align-middle">
                          {tx.fromEmail !== "N/A" ? (
                            <div className="flex items-center gap-1.5">
                              <span className="truncate max-w-[140px]">{tx.fromEmail}</span>
                              <button
                                onClick={() => copyToClipboard(tx.fromEmail, "From email")}
                                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm align-middle">
                          {tx.toEmail !== "N/A" ? (
                            <div className="flex items-center gap-1.5">
                              <span className="truncate max-w-[140px]">{tx.toEmail}</span>
                              <button
                                onClick={() => copyToClipboard(tx.toEmail, "To email")}
                                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm align-middle">{formatAmountForList(tx.amount)} USDC</td>
                        <td className="py-3 px-4 text-sm align-middle" onClick={(e) => e.stopPropagation()}>
                          {tx.transactionId ? (
                            <div className="flex items-center gap-1.5 font-mono">
                              <a
                                href={getExplorerUrl(tx.transactionId)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline truncate max-w-[120px]"
                              >
                                {`${tx.transactionId.slice(0, 6)}...${tx.transactionId.slice(-4)}`}
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(tx.transactionId, "Transaction ID");
                                }}
                                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>

    
                        <td className="py-3 px-4 text-sm align-middle">
                          <div className="flex items-center gap-2">
                            {tx.type === "Send" && <Send className="w-4 h-4 text-primary" />}
                            {tx.type === "Receive" && <Send className="w-4 h-4 text-success rotate-180" />}
                            {tx.type === "Buy" && <TrendingUp className="w-4 h-4 text-success" />}
                            {tx.type === "Sell" && <TrendingDown className="w-4 h-4 text-destructive" />}
                            <span>{tx.type}</span>
                          </div>
                        </td>
                        
                        {/* <td className="py-3 px-4 text-sm">
                          {tx.gasFee !== "N/A" ? `${formatAmountForList(tx.gasFee)} USDC` : "N/A"}
                        </td> */}
                        <td className="py-3 px-4 text-sm align-middle">
                          <span
                            className={cn(
                              "font-medium",
                              tx.status === "Success" && "text-success",
                              tx.status === "Failed" && "text-destructive"
                            )}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm align-middle">{tx.date}</td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Transaction List */}
              <div className="lg:hidden space-y-3">
                {paginatedTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTransaction(tx)}
                    className="border border-border rounded-xl p-4 cursor-pointer hover:bg-muted/20 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted">
                            {getNameIcon(
                              tx.fromEmail !== "N/A" ? tx.fromEmail : tx.toEmail
                            )}
                          </div>
                          <div
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background",
                              tx.type === "Send" && "bg-primary",
                              tx.type === "Receive" && "bg-success",
                              tx.type === "Buy" && "bg-success",
                              tx.type === "Sell" && "bg-destructive"
                            )}
                          >
                            {tx.type === "Send" && (
                              <Send className="w-2.5 h-2.5 text-primary-foreground" />
                            )}
                            {tx.type === "Receive" && (
                              <Send className="w-2.5 h-2.5 text-success-foreground rotate-180" />
                            )}
                            {tx.type === "Buy" && (
                              <TrendingUp className="w-2.5 h-2.5 text-success-foreground" />
                            )}
                            {tx.type === "Sell" && (
                              <TrendingDown className="w-2.5 h-2.5 text-destructive-foreground" />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-foreground truncate max-w-[180px]">
                            From: {tx.fromEmail !== "N/A" ? tx.fromEmail : "-"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            To: {tx.toEmail !== "N/A" ? tx.toEmail : "-"}
                          </p>
                          {tx.transactionId && (
                            <a
                              href={getExplorerUrl(tx.transactionId)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-primary hover:underline mt-0.5 inline-block"
                            >
                              View on explorer
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "font-semibold",
                            tx.type === "Receive" && "text-success",
                            tx.type === "Send" && "text-foreground"
                          )}
                        >
                          {tx.type === "Receive" ? "+" : tx.type === "Send" ? "-" : ""}
                          {formatAmountForList(tx.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">USDC</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Transaction Detail Card Modal */}
         

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                const size = parseInt(value, 10);
                setPageSize(size);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-28 h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-3 flex-wrap justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={currentPageSafe === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page <span className="font-medium">{currentPageSafe}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={currentPageSafe === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="hidden md:flex items-center gap-2 ml-4">
                <Input
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                  className="w-12 h-8 rounded-lg text-center"
                  placeholder="1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg gap-1"
                  onClick={() => {
                    const page = parseInt(goToPage, 10);
                    if (!isNaN(page)) {
                      const clamped = Math.min(
                        Math.max(page, 1),
                        totalPages
                      );
                      setCurrentPage(clamped);
                    }
                  }}
                >
                  Go to
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TransactionHistory;