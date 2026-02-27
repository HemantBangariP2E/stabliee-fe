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
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.fromEmail.toLowerCase().includes(query) ||
      tx.toEmail.toLowerCase().includes(query) ||
      tx.transactionId.toLowerCase().includes(query) ||
      (tx.batchId && tx.batchId.toLowerCase().includes(query))
    );
  });

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
              <Select>
                <SelectTrigger className="w-24 md:w-28 h-9 rounded-lg">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="send">Send</SelectItem>
                  <SelectItem value="receive">Receive</SelectItem>
                </SelectContent>
              </Select>
              <Select>
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        <div className="flex items-center gap-1">
                          USDC Transaction
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">From email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">To email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fees</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTransaction(tx)}
                        className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 text-sm">{tx.date}</td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            {tx.type === "Send" && <Send className="w-4 h-4 text-primary" />}
                            {tx.type === "Receive" && <Download className="w-4 h-4 text-success" />}
                            {tx.type === "Buy" && <TrendingUp className="w-4 h-4 text-success" />}
                            {tx.type === "Sell" && <TrendingDown className="w-4 h-4 text-destructive" />}
                            <span>{tx.type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{formatAmountForList(tx.amount)} USDC</td>
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
                        <td className="py-3 px-4 text-sm">
                          {tx.gasFee !== "N/A" ? `${formatAmountForList(tx.gasFee)} USDC` : "N/A"}
                        </td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Transaction List */}
              <div className="lg:hidden space-y-3">
                {filteredTransactions.map((tx) => (
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
          {selectedTransaction && (
            <div 
              className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setSelectedTransaction(null)}
            >
              <div 
                className="bg-background w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with close button */}
                <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Transaction Details</h3>
                  <button 
                    onClick={() => setSelectedTransaction(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Transaction Summary */}
                <div className="p-6 space-y-6">
                  {/* Top Section: Participants, Type Icon, Amount, Date */}
                  <div className="text-center space-y-3">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto bg-muted">
                      {getNameIcon(
                        selectedTransaction.fromEmail !== "N/A"
                          ? selectedTransaction.fromEmail
                          : selectedTransaction.toEmail
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate max-w-[220px] mx-auto">
                        From: {selectedTransaction.fromEmail !== "N/A" ? selectedTransaction.fromEmail : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[220px] mx-auto">
                        To: {selectedTransaction.toEmail !== "N/A" ? selectedTransaction.toEmail : "-"}
                      </p>
                    </div>
                    <p className={cn(
                      "text-2xl font-bold",
                      selectedTransaction.type === "Receive" && "text-success",
                      selectedTransaction.type === "Buy" && "text-success"
                    )}>
                      {selectedTransaction.type === "Receive" || selectedTransaction.type === "Buy" ? "+" : "-"}{selectedTransaction.amount}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.date}</p>
                    
                    {/* Type and Status */}
                    <div className="flex items-center justify-center gap-2">
                      <div className={cn(
                        "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg",
                        selectedTransaction.type === "Send" && "bg-primary/10 text-primary",
                        selectedTransaction.type === "Receive" && "bg-success/10 text-success",
                        selectedTransaction.type === "Buy" && "bg-success/10 text-success",
                        selectedTransaction.type === "Sell" && "bg-destructive/10 text-destructive"
                      )}>
                        {getTypeIcon(selectedTransaction.type)}
                        <span>{selectedTransaction.type}</span>
                      </div>
                      <span className={cn(
                        "text-sm font-medium px-3 py-1.5 rounded-lg",
                        selectedTransaction.status === "Success" && "bg-success/10 text-success",
                        selectedTransaction.status === "Failed" && "bg-destructive/10 text-destructive"
                      )}>
                        {selectedTransaction.status}
                      </span>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="border border-border rounded-xl divide-y divide-border">
                    
                    <div className="flex items-center justify-between p-4">
                      <span className="text-sm text-muted-foreground">Transaction Hash</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium font-mono">
                          {selectedTransaction.transactionId
                            ? `${selectedTransaction.transactionId.slice(0, 4)}...${selectedTransaction.transactionId.slice(-4)}`
                            : "N/A"}
                        </span>
                        <button
                          onClick={() => copyToClipboard(selectedTransaction.transactionId, "Transaction ID")}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {selectedTransaction.batchId && (
                      <div className="flex items-center justify-between p-4">
                        <span className="text-sm text-muted-foreground">Batch ID</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{selectedTransaction.batchId}</span>
                          <button
                            onClick={() => copyToClipboard(selectedTransaction.batchId!, "Batch ID")}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedTransaction.fromEmail !== "N/A" && (
                      <div className="flex items-center justify-between p-4">
                        <span className="text-sm text-muted-foreground">From email</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate max-w-[180px]">
                            {selectedTransaction.fromEmail}
                          </span>
                          <button
                            onClick={() => copyToClipboard(selectedTransaction.fromEmail, "From email")}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedTransaction.toEmail !== "N/A" && (
                      <div className="flex items-center justify-between p-4">
                        <span className="text-sm text-muted-foreground">To email</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate max-w-[180px]">
                            {selectedTransaction.toEmail}
                          </span>
                          <button
                            onClick={() => copyToClipboard(selectedTransaction.toEmail, "To email")}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-4">
                      <span className="text-sm text-muted-foreground">Fees</span>
                      <span className="text-sm font-medium">{selectedTransaction.gasFee}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4">
                      <span className="text-sm text-muted-foreground">Date & Time</span>
                      <span className="text-sm font-medium">{selectedTransaction.date}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Close Button */}
                <div className="sticky bottom-0 bg-background border-t border-border p-4">
                  <Button 
                    onClick={() => setSelectedTransaction(null)}
                    className="w-full rounded-xl"
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
            <Select defaultValue="10">
              <SelectTrigger className="w-full sm:w-28 h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10/Pages</SelectItem>
                <SelectItem value="25">25/Pages</SelectItem>
                <SelectItem value="50">50/Pages</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="default" size="sm" className="h-8 w-8 rounded-lg">
                1
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg">
                2
              </Button>
              <span className="text-muted-foreground hidden sm:inline">...</span>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg hidden sm:flex">
                5
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <div className="hidden md:flex items-center gap-2 ml-4">
                <Input 
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                  className="w-12 h-8 rounded-lg text-center"
                  placeholder="1"
                />
                <Button variant="ghost" size="sm" className="h-8 rounded-lg gap-1">
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