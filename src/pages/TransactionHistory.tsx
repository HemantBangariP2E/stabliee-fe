import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, ChevronLeft, ChevronRight, ArrowUpDown, Copy, Send, Download, TrendingUp, TrendingDown, X, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/hooks/supabaseClient";

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



const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [filterType, setFilterType] = useState<"all" | "send" | "receive">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed" | "pending">("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);


  useEffect(() => {
  const fetchTransactions = async () => {
    const ownerAddress = localStorage.getItem("ownerAddress")

    if (!ownerAddress) return

    setLoading(true)

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .or(
        `owner_address.eq.${ownerAddress},to_address.eq.${ownerAddress}`
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Fetch tx error:", error.message)
      setLoading(false)
      return
    }

    // 🔁 map DB → UI format
    const mapped = data.map((tx: any, index: number): Transaction => ({
      id: index + 1,
      transactionId: tx.tx_hash,
      batchId: tx.batch_id || null, // if you add later
      date: new Date(tx.created_at).toLocaleString(),
      type:
        tx.direction === "SENT"
          ? "Send"
          : tx.direction === "RECEIVE"
          ? "Receive"
          : "Send",
      fromEmail: tx.from_email || "N/A",
      toEmail: tx.to_email || "N/A",
      amount: `${Number(tx.amount).toFixed(8)} ${tx.token_symbol}`,
      address: tx.to_address,
      status:
        tx.status === "SUCCESS"
          ? "Success"
          : tx.status === "FAILED"
          ? "Failed"
          : "Pending",
      gasFee:
        tx.gas_fee !== null
          ? `${Number(tx.gas_fee).toFixed(8)} ${tx.token_symbol}`
          : "N/A",
    }))

    setTransactions(mapped)
    setLoading(false)
  }

  fetchTransactions()
}, [])

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
        return <Download className="w-5 h-5 text-success" />;
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
    return value.toFixed(3);
  };

  const filteredTransactions = transactions.filter((tx) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      tx.fromEmail.toLowerCase().includes(query) ||
      tx.toEmail.toLowerCase().includes(query) ||
      tx.transactionId.toLowerCase().includes(query) ||
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

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  return (

    
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        <Card className="p-4 md:p-6 rounded-2xl">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search email, batch ID, txn ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full md:w-72 h-10 rounded-xl"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <span className="text-sm text-muted-foreground hidden md:inline">Filter</span>
              <div className="hidden md:flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 rounded-lg gap-2">
                  <Calendar className="w-4 h-4" />
                  Start date
                </Button>
                <span className="text-muted-foreground">To</span>
                <Button variant="outline" size="sm" className="h-9 rounded-lg gap-2">
                  <Calendar className="w-4 h-4" />
                  End Date
                </Button>
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
                  <SelectItem value="all">All</SelectItem>
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
                  <SelectItem value="all">All</SelectItem>
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
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">From email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">To email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">TX Hash</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>


                        {/* <div className="flex items-center gap-1">
                          USDC Transaction
                          <ArrowUpDown className="w-3.5 h-3.5" /> */}
                        {/* </div> */}
                      {/* </th> */}
                      
                      {/* <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Gas</th> */}
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
                        className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 text-sm">
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
                        <td className="py-3 px-4 text-sm">
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
                        <td className="py-3 px-4 text-sm">{formatAmountForList(tx.amount)} USDC</td>
                        <td className="py-3 px-4 text-sm">
                          {tx.transactionId ? (
                            <div className="flex items-center gap-1.5 font-mono">
                              <span>
                                {`${tx.transactionId.slice(0, 4)}...${tx.transactionId.slice(-4)}`}
                              </span>
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

    
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            {tx.type === "Send" && <Send className="w-4 h-4 text-primary" />}
                            {tx.type === "Receive" && <Download className="w-4 h-4 text-success" />}
                            {tx.type === "Buy" && <TrendingUp className="w-4 h-4 text-success" />}
                            {tx.type === "Sell" && <TrendingDown className="w-4 h-4 text-destructive" />}
                            <span>{tx.type}</span>
                          </div>
                        </td>
                        
                        {/* <td className="py-3 px-4 text-sm">
                          {tx.gasFee !== "N/A" ? `${formatAmountForList(tx.gasFee)} USDC` : "N/A"}
                        </td> */}
                        <td className="py-3 px-4 text-sm">
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
                        <td className="py-3 px-4 text-sm">{tx.date}</td>

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
                              <Download className="w-2.5 h-2.5 text-success-foreground" />
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