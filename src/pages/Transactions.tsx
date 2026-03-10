import { useState, useRef, useEffect } from "react";
// import { parseUnits } from "ethers";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import baseLogo from "@/assets/base-logo.png";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/hooks/supabaseClient";
import { ethers } from "ethers";
import { GasFeeDisplay } from "@/components/GasFeeDisplay";
const mockBeneficiaries = [{
  id: 1,
  name: "TTT",
  email: "tahirjamaluddin@gmail.com",
  address: "0x7e5881f281a7c47f7064f4607d61a8b2c"
}, {
  id: 2,
  name: "Tah",
  email: "farooqui.nils@gmail.com",
  address: "0xfd5ea76dfb8ec7d8ff2ace3d4e4d9f1a"
}, {
  id: 3,
  name: "Vikas",
  email: "vikas.i@gmail.com",
  address: "0x8b161adb1a9cba42a227fd587e4b3c7e"
}, {
  id: 4,
  name: "Tahir",
  email: "tahir.jamal@enordwallet.com",
  address: "0xb42f2146dce442c9c08fcbefca94d2f5"
}, {
  id: 5,
  name: "Alex Wallet",
  email: "",
  address: "0x3a9f8c2d1e5b7a4c6d8e0f1a2b3c4d5e"
}, {
  id: 6,
  name: "Sarah Pending",
  email: "sarah.new@example.com",
  address: "0x9d4e7f2a1b8c5d3e6f0a2b4c"
}];
const Transactions = () => {
  const [searchParams] = useSearchParams();
   const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const emailFromUrl = searchParams.get("email") || "";
  const [recipientEmail, setRecipientEmail] = useState(emailFromUrl);
  const [recipientWallet, setRecipientWallet] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<"KC" | "EURC">("KC");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [walletSearchQuery, setWalletSearchQuery] = useState("");
  const [selectedWalletBeneficiary, setSelectedWalletBeneficiary] = useState<number | null>(null);
  const [sendInputMode, setSendInputMode] = useState<"email" | "wallet">("email");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [account] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const eth = (window as any).ethereum;
    return localStorage.getItem("ownerAddress") || (eth && eth.selectedAddress) || null;
  });
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const balances = {
    KC: usdcBalance ?? 0,
    EURC: 0.0
  };
  const availableBalance = balances[selectedCurrency];
  const currencies = [{
    id: "KC",
    name: "USD Coin",
    symbol: "$",
    color: "#2775CA"
  }] as const;
   const ownerAddress = localStorage.getItem("ownerAddress") || undefined;

    const walletAddress = ownerAddress || "0x4c1a9cc6Cf1da9cc6Cf1daEDE3";

  const getEthSepoliaRpcUrl = (): string =>
    (import.meta.env.VITE_ETH_SEPOLIA_RPC as string) || "https://ethereum-sepolia-rpc.publicnode.com";

  const getRpcUrlAndToken = (): { rpcUrl: string; tokenAddress: string } => {
    const chainId = localStorage.getItem("chainIdConfig");
    const blockchainName = (localStorage.getItem("blockchainName") || "BASE").toUpperCase();
    if (blockchainName === "ETH" || chainId === "11155111") {
      return {
        rpcUrl: getEthSepoliaRpcUrl(),
        // USDT on Sepolia: https://sepolia.etherscan.io/token/0x5aec77a2cbe8ee9d359f965826bddfa026dffb38
        tokenAddress: "0x5aEC77A2CBE8ee9D359F965826BdDFa026DfFb38",
      };
    }
    return {
      rpcUrl: chainId === "84532" ? "https://sepolia.base.org" : "https://mainnet.base.org",
      tokenAddress: "0x28bD35b56bfCa732C7DF2F2d08312169189605A8",
    };
  };

  const isEthChain = (): boolean => {
    const chainId = localStorage.getItem("chainIdConfig");
    const blockchainName = (localStorage.getItem("blockchainName") || "BASE").toUpperCase();
    return blockchainName === "ETH" || chainId === "11155111";
  };
  const tokenLabel = isEthChain() ? "USDT" : "USDC";
  const gasChain = isEthChain() ? "eth" : "base";

  const getTokenBalance = async (address: string): Promise<number> => {
    const { rpcUrl, tokenAddress } = getRpcUrlAndToken();
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(address),
      contract.decimals(),
    ]);
    return Number(ethers.formatUnits(balance, decimals));
  };

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

  // Pre-fill email from URL params
  useEffect(() => {
    if (emailFromUrl) {
      setRecipientEmail(emailFromUrl);
      const matchingBeneficiary = mockBeneficiaries.find(b => b.email === emailFromUrl);
      if (matchingBeneficiary) {
        setSelectedBeneficiary(matchingBeneficiary.id);
      }
    }
  }, [emailFromUrl]);

    useEffect(() => {
      if (!ownerAddress) return;
      let cancelled = false;
      (async () => {
        try {
          const balance = await getTokenBalance(ownerAddress);
          if (!cancelled) setUsdcBalance(balance);
        } catch (e) {
          console.error("Error fetching token balance:", e);
          if (!cancelled) setUsdcBalance(null);
        }
      })();
      return () => { cancelled = true; };
    }, [ownerAddress]);

  // Fee calculation: Network Gas from live chain gas (same as GasFeeDisplay), Network Gas (1%) = 1% of that
  const feePercent = 0.01; // 1%
  const networkFee = 1;
  const GAS_LIMIT_ESTIMATE = 65_000;
  const [gasFeeInTokens, setGasFeeInTokens] = useState(0); // Network Gas in token (USDC/USDT), from live gas
  const gasFee = gasFeeInTokens;
  const serviceFee = 0;
  const gasFeeOnePercent = gasFee * feePercent;

  const COINGECKO_INTERVAL_MS = 15 * 60 * 1000; // 15 min to avoid 429
  const [ethPriceUsd, setEthPriceUsd] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json?.ethereum?.usd != null) setEthPriceUsd(Number(json.ethereum.usd));
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

  useEffect(() => {
    let cancelled = false;
    const { rpcUrl } = getRpcUrlAndToken();
    const run = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const feeData = await provider.getFeeData();
        const gweiStr = feeData.gasPrice != null ? ethers.formatUnits(feeData.gasPrice, "gwei") : null;
        if (cancelled || gweiStr == null) return;
        const g = parseFloat(gweiStr);
        if (Number.isNaN(g)) return;
        const estFeeEth = (g * 1e-9) * GAS_LIMIT_ESTIMATE;
        const ethUsd = ethPriceUsd;
        if (cancelled || ethUsd == null) return;
        const inTokens = estFeeEth * ethUsd;
        if (!cancelled) setGasFeeInTokens(Math.round(inTokens * 1e6) / 1e6);
      } catch {
        // keep last gasFeeInTokens on error
      }
    };
    run();
    const t = setInterval(run, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [gasChain, ethPriceUsd]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setIsWalletDropdownOpen(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const filteredBeneficiaries = mockBeneficiaries.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.email.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredWalletBeneficiaries = mockBeneficiaries.filter(b => b.address && (b.name.toLowerCase().includes(walletSearchQuery.toLowerCase()) || b.address.toLowerCase().includes(walletSearchQuery.toLowerCase())));
  const selectWalletRecipient = (beneficiary: (typeof mockBeneficiaries)[0]) => {
    setSelectedWalletBeneficiary(beneficiary.id);
    setRecipientWallet(beneficiary.address);
  };
  const selectRecipient = (beneficiary: (typeof mockBeneficiaries)[0]) => {
    setSelectedBeneficiary(beneficiary.id);
    setRecipientEmail(beneficiary.email);
  };
  const handleConfirmTransfer = () => {
    const recipient = sendInputMode === "email" ? recipientEmail : recipientWallet;
    if (!recipient || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be greater than 0",
        variant: "destructive"
      });
      return;
    }
    if (gasFeeInTokens <= 0) {
      toast({
        title: "Network Fee Loading",
        description: "Please wait for network gas fees to load before confirming.",
        variant: "destructive"
      });
      return;
    }
    if (amountNum > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You cannot send more than your available balance of ${availableBalance.toLocaleString()} ${tokenLabel}`,
        variant: "destructive"
      });
      return;
    }
    if (amountNum === 6) {
      toast({
        title: "Transaction Failed",
        description: "Unable to process your transfer, Please try again later",
        variant: "destructive"
      });
      return;
    }
    if (amountNum === 7) {
      setShowInviteDialog(true);
      return;
    }
    if (amountNum === 9) {
      toast({
        title: "User Not Found",
        description: "Please invite user to Stabilee to send them funds",
        variant: "destructive"
      });
      return;
    }
    setShowConfirmDialog(true);
  };
  const getRecipientWallet = () => {
    const beneficiary = mockBeneficiaries.find(b => b.email === recipientEmail);
    
    return beneficiary?.address || "0x...new_wallet";
  };
  const getTotalAmount = () => {
    const amountNum = parseFloat(amount || "0") || 0;
    return (amountNum + networkFee + gasFee + gasFeeOnePercent + serviceFee).toFixed(6);
  };
  const handleFinalConfirm = () => {
    setShowConfirmDialog(false);
    processTransfer();
  };
  const processTransfer = () => {
    const recipient = sendInputMode === "email" ? getRecipientWallet() : recipientWallet;
    toast({
      title: "Transfer Initiated",
      description: `Sending ${amount} ${tokenLabel} to ${recipient}`
    });
  };
  const handleSendInvite = () => {
    setShowInviteDialog(false);
    toast({
      title: "Recipient Setup Complete",
      description: `${recipientEmail} is now set up to receive funds securely via Stabilee`
    });
  };


  
const insertTransaction = async ({
  txHash,
  to,
  amount,
  direction,
  status,
  gasFee = 0,
  ownerAddress,
  fromAddress,
    fromEmail,
  toEmail
}: {
  txHash: string
  to: string
  amount: number
  direction: "SENT" | "RECEIVE"
  status: "SUCCESS" | "PENDING" | "FAILED"
  gasFee?: number,
  ownerAddress?: string,
  fromAddress?: string,
  fromEmail?: string,
  toEmail?: string
}) => {
  // const ownerAddress = localStorage.getItem("ownerAddress")

  if (!ownerAddress) return

  const { error } = await supabase.from("transactions").insert({
    tx_hash: txHash,
    owner_address: ownerAddress,
    from_address: ownerAddress,
    to_address: to,
    amount: amount,
    token_symbol: selectedCurrency,
    direction,
    status,
    gas_fee: gasFee,
    from_email: localStorage.getItem("userIdentifier") || "",
    to_email: recipientEmail
  })

  if (error) {
    console.error("Supabase insert error:", error.message)
  }
}



  const getSendErrorMessage = (err: unknown, recipientVerifiedByEmail = false): string => {
    const msg = (err as { message?: string })?.message ?? String(err);
    if (recipientVerifiedByEmail) return msg;
    const isWalletNotCreated = /wallet|not found|not created|not registered|receiver|account does not exist|invalid recipient|does not exist|unregistered/i.test(msg);
    return isWalletNotCreated
      ? "This wallet address has not been created or registered. Please ask the recipient to set up their wallet first."
      : msg;
  };

  const isRecipientInDb = async (walletAddress: string): Promise<boolean> => {
    const addr = walletAddress.trim();
    if (!addr) return false;
    const { data, error } = await supabase
      .from("user_logins")
      .select("owner_address")
      .ilike("owner_address", addr)
      .limit(1)
      .maybeSingle();
    if (error) return false;
    return data != null;
  };

  const getUserWalletByEmail = async (email: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from("user_logins")
      .select("owner_address")
      .eq("user_identifier", email.trim().toLowerCase())
      .maybeSingle();
    if (error || !data?.owner_address) return null;
    return data.owner_address;
  };

  const sendTransaction = async (e) => {
    e.preventDefault()
    setError('')
    setTxHash('')

    if (!account) {
      setError('Please connect your wallet first')
      return
    }

    if (!amount?.trim()) {
      setError('Please enter amount')
      return
    }

    let recipientAddress: string;
    let recipientVerifiedByEmail = false;
    if (sendInputMode === "email") {
      if (!recipientEmail?.trim()) {
        setError('Please enter recipient email')
        return
      }
      const wallet = await getUserWalletByEmail(recipientEmail);
      if (!wallet) {
        setError('User not found. This user is not registered. Please ask the recipient to sign up first.')
        return
      }
      recipientAddress = wallet;
      recipientVerifiedByEmail = true;
    } else {
      if (!recipientWallet?.trim()) {
        setError('Please enter recipient address')
        return
      }
      recipientAddress = recipientWallet.trim();
      const recipientInDb = await isRecipientInDb(recipientAddress);
      if (!recipientInDb) {
        setError('User not found. This wallet address is not registered. Please ask the recipient to sign up first.')
        return
      }
    }

    if (!/^0x[a-fA-F0-9]{40}$/i.test(recipientAddress)) {
      setError('Invalid Ethereum address')
      return
    }

    setLoading(true)
    // const amountInWei = parseUnits(amount, 18).toString();
    console.log("wallet type====:", localStorage.getItem('walletType'));

    if(localStorage.getItem('walletProvider')=='metamask'){
      try {
        const txParams = {
          from: account,
          to: recipientEmail,
        
        }

        console.log("Sending transaction with params:", txParams);

        //@ts-ignore
        const hash = await window.exectueMetamaskTxn('NONPAYABLE',localStorage.getItem('nativeToken'),[
          {
            "name": "transfer",
            "type": "function",
            "stateMutability": "nonpayable",
            "inputs": [
              { "name": "to", "type": "address" },
              { "name": "value", "type": "uint256" }
            ],
            "outputs": [{ "type": "bool" }]
          }
        ],'transfer',[
          recipientAddress
        ]);

        console.log("Transaction hash:", hash);
 const pendingHash = "PENDING_" + Date.now();

await insertTransaction({
  txHash: pendingHash,
  to: recipientAddress,
  amount: Number(amount),
  direction: "SENT",
  status: "PENDING",
  gasFee: networkFee,
  
});

// after getting real hash
const finalHash = hash.txHash ? hash.txHash : hash.blockHash;

await supabase
  .from("transactions")
  .update({
    tx_hash: finalHash,
    status: "SUCCESS",
  })
  .eq("tx_hash", pendingHash);
        // setRecipient()
        // setAmount('')
        const txHashForUrl = hash.txHash ? hash.txHash : hash.blockHash;
        const chain = (localStorage.getItem('blockchainName') || 'BASE').toUpperCase();
        setUrl(chain === 'ETH' ? `https://sepolia.etherscan.io/tx/${txHashForUrl}` : `https://sepolia.basescan.org/tx/${txHashForUrl}`);
      } catch (err) {
        console.log("Transaction error:", err);
        setError(getSendErrorMessage(err, recipientVerifiedByEmail))
      } finally {
        setLoading(false)
      }
    } else {
      try {
        const fee = gasFee + gasFeeOnePercent + networkFee;
        const feeRecipient = "0x192d2371F0A9235231C10060031484E961dcBDA5";
        const blockchainName = localStorage.getItem('blockchainName') || '';
        const tokenContractAddress = blockchainName === 'BASE'
          ? '0xE9b0B7c1463916475A2278E04e4727FB4666EeD3'
          : blockchainName === 'ETH'
            ? '0xfE9F09aa5b416b5A83bD9387A99Fc7b1185e3D2A'
            : '0xE9b0B7c1463916475A2278E04e4727FB4666EeD3';
        const win = window as any;
        let executeMPCTxn = win.executeMPCTokenTxn ?? win.exectueMPCTokenTxn;
        if (typeof executeMPCTxn !== 'function') {
          await new Promise((r) => setTimeout(r, 1500));
          executeMPCTxn = win.executeMPCTokenTxn ?? win.exectueMPCTokenTxn;
        }
        if (typeof executeMPCTxn !== 'function') {
          throw new Error('Embedded wallet is not ready. Refresh the page and try again, or sign in again from the login page.');
        }
        const hash = await executeMPCTxn(
          localStorage.getItem('ownerAddress'),
          recipientAddress,
          parseInt(amount),
          parseInt(localStorage.getItem('chainIdConfig')),
          localStorage.getItem('networkName'),
          blockchainName,
          tokenContractAddress,
          localStorage.getItem('userShard'),
          localStorage.getItem('userIdentifier'),
          fee,
          feeRecipient
        );
        console.log("Transaction hash:", hash);
        setTxHash(hash.txHash);
  setTxHash(hash.txHash);
const pendingHash = "PENDING_" + Date.now();
await insertTransaction({
  txHash: hash.txHash,
  to: recipientAddress,
  amount: Number(amount),
  direction: "SENT",
  status: "SUCCESS",
  gasFee: networkFee,
  ownerAddress: localStorage.getItem("ownerAddress") || "",
  fromAddress: localStorage.getItem("ownerAddress") || "",
  fromEmail: recipientEmail,
  toEmail: recipientEmail
});



// await insertTransaction({
//   txHash: hash.txHash,
//   to: localStorage.getItem("ownerAddress") || "",
//   amount: Number(amount),
//   direction: "RECEIVE",
//   status: "SUCCESS",
//   gasFee: networkFee,
//   ownerAddress: recipientWallet,
//   fromAddress: recipientWallet,
//     fromEmail: recipientEmail,
//   toEmail: recipientEmail
// });

await supabase
  .from("transactions")
  .update({
    tx_hash: hash.txHash,
    status: "SUCCESS",
  })
  .eq("tx_hash", pendingHash);
        const chain = (localStorage.getItem('blockchainName') || 'BASE').toUpperCase();
        setUrl(chain === 'ETH' ? `https://sepolia.etherscan.io/tx/${hash.txHash}` : `https://sepolia.basescan.org/tx/${hash.txHash}`);
        // setRecipient('');
        // setAmount('');
      } catch (err) {
        console.log("Transaction error:", err);
        setError(getSendErrorMessage(err, recipientVerifiedByEmail))
      } finally {
        setLoading(false) 
      }
    }
  }

  useEffect(() => {
  const fetchOwnerAddress = async () => {
    const normalizedEmail = recipientEmail?.trim().toLowerCase();
    if (!normalizedEmail) {
      setRecipientWallet("");
      return;
    }

    const { data, error } = await supabase
      .from("user_logins")
      .select("owner_address")
      .eq("user_identifier", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("Error fetching owner address:", error.message);
      return;
    }

    if (data?.owner_address) {
      console.log("Owner address for email:", data.owner_address);
      setRecipientWallet(data.owner_address);
    } else {
      console.log("No owner address found for this email");
      setRecipientWallet("");
    }
  };

  fetchOwnerAddress();
}, [recipientEmail]);

  // const sendTransaction = async (e?: any) => {
  //   if (e && typeof e.preventDefault === "function") {
  //     e.preventDefault();
  //   }

  //   setError("");
  //   setTxHash("");

  //   const recipientAddress = sendInputMode === "email" ? getRecipientWallet() : recipientWallet;
  //   console.log("Recipient Address:", recipientAddress);

  //   if (!account) {
  //     setError("Please connect your wallet first");
  //     return;
  //   }

  //   if (!recipientEmail || !amount) {
  //     setError("Please enter recipient address and amount");
  //     return;
  //   }

  //   if (!/^0x[a-fA-F0-9]{40}$/.test(recipientEmail)) {
  //     setError("Invalid Ethereum address");
  //     return;
  //   }

  //   setLoading(true);
  //   // const amountInWei = parseUnits(amount, 18).toString();
  //   console.log("wallet type====:", localStorage.getItem("walletType"));

  //   if (localStorage.getItem("walletProvider") === "metamask") {
  //     try {
  //       const txParams = {
  //         from: account,
  //         to: recipientEmail,
  //         // value: "0x" + amountInWei
  //       };
  //       console.log("receipt parameters:", recipientEmail);
  //       console.log("Sending transaction with params:", txParams);
  //       const hash = await (window as any).exectueMetamaskTxn(
  //         "NONPAYABLE",
  //         "0x28bD35b56bfCa732C7DF2F2d08312169189605A8",
  //         [
  //           {
  //             name: "transfer",
  //             type: "function",
  //             stateMutability: "nonpayable",
  //             inputs: [
  //               { name: "to", type: "address" },
  //               { name: "value", type: "uint256" }
  //             ],
  //             outputs: [{ type: "bool" }]
  //           }
  //         ],
  //         "transfer",
  //         [recipientAddress]
  //       );

  //       console.log("Transaction hash:", hash);
  //       const finalHash = hash.txHash ? hash.txHash : hash.blockHash;
  //       setTxHash(finalHash);
  //       setAmount("");
  //       setUrl("https://sepolia.etherscan.io/tx/" + finalHash);
  //     } catch (err: any) {
  //       console.log("Transaction error:", err);
  //       setError(err?.message || "Transaction failed");
  //     } finally {
  //       setLoading(false);
  //     }
  //   } else {
  //     try {
  //       const hash = await (window as any).exectueMPCTokenTxn(
  //         localStorage.getItem("ownerAddress"),
  //         recipientAddress,
  //         parseInt(amount),
  //         parseInt(localStorage.getItem("chainIdConfig") || "0"),
  //         localStorage.getItem("networkName"),
  //         localStorage.getItem("blockchainName"),
  //         "0x28bD35b56bfCa732C7DF2F2d08312169189605A8",
  //         localStorage.getItem("userShard"),
  //         localStorage.getItem("userIdentifier")
  //       );
  //       console.log("Transaction hash:", hash);
  //       setTxHash(hash.txHash);
  //       setUrl(
  //         () =>
  //           (localStorage.getItem("networkName") === "sepolia"
  //             ? "https://sepolia.etherscan.io/tx/"
  //             : "https://sepolia.basescan.org//tx/") + hash.txHash
  //       );
  //       setAmount("");
  //     } catch (err: any) {
  //       console.log("Transaction error:", err);
  //       setError(err?.message || "Transaction failed");
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  // }
  
  return <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Card className="p-6 rounded-2xl">
          <div>
            {/* Recipient Input */}
            <div className="mb-6">
              {sendInputMode === "email" ? <>
                  <p className="text-xs text-muted-foreground mb-2">Email</p>
                  <Input 
                    placeholder="Enter recipient email" 
                    value={recipientEmail} 
                    onChange={e => setRecipientEmail(e.target.value)} 
                    className="h-12 rounded-xl" 
                    type="email"
                  />
                </> : <>
                  <p className="text-xs text-muted-foreground mb-2">Select from contacts or enter wallet address</p>

                  <div className="relative" ref={walletDropdownRef}>
                    <div className="relative" onClick={() => setIsWalletDropdownOpen(true)}>
                      <Input placeholder="Select contact or enter 0x..." value={recipientWallet} onChange={e => {
                    setRecipientWallet(e.target.value);
                    setSelectedWalletBeneficiary(null);
                    setWalletSearchQuery(e.target.value);
                    setIsWalletDropdownOpen(true);
                  }} onFocus={() => setIsWalletDropdownOpen(true)} className="h-12 rounded-xl pr-10 font-mono text-sm" />
                      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform ${isWalletDropdownOpen ? "rotate-180" : ""}`} />
                    </div>

                    {isWalletDropdownOpen && <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg">
                        <ScrollArea className="max-h-48">
                          <div className="p-1">
                            {filteredWalletBeneficiaries.map(beneficiary => <button key={beneficiary.id} onClick={() => {
                        selectWalletRecipient(beneficiary);
                        setIsWalletDropdownOpen(false);
                      }} className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${selectedWalletBeneficiary === beneficiary.id ? "bg-primary/10" : "hover:bg-muted/50"}`}>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                    {beneficiary.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{beneficiary.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">
                                      {beneficiary.address.slice(0, 6)}...{beneficiary.address.slice(-4)}
                                    </p>
                                  </div>
                                </div>
                                {selectedWalletBeneficiary === beneficiary.id && <Check className="w-4 h-4 text-primary" />}
                              </button>)}
                            {filteredWalletBeneficiaries.length === 0 && recipientWallet && <p className="text-sm text-muted-foreground text-center py-4">
                                Using custom wallet:{" "}
                                <span className="font-medium text-foreground font-mono">
                                  {recipientWallet.slice(0, 10)}...
                                </span>
                              </p>}
                            {filteredWalletBeneficiaries.length === 0 && !recipientWallet && <p className="text-sm text-muted-foreground text-center py-4">
                                No contacts with wallet found
                              </p>}
                          </div>
                        </ScrollArea>
                      </div>}
                  </div>
                </>}
            </div>

            {/* Amount */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-foreground">Amount</Label>
              <div className="relative mt-2 flex">
                <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="h-12 rounded-xl rounded-r-none border-r-0 flex-1" />
                <div className="h-12 px-4 rounded-xl rounded-l-none border border-border bg-muted/50 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#2775CA" }}>
                    <span className="text-white text-[10px] font-bold">$</span>
                  </div>
                  <span className="font-medium text-sm">{tokenLabel}</span>
                </div>
              </div>
              <button type="button" onClick={() => setAmount(availableBalance.toString())} className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer mt-2">
                Available: {usdcBalance !== null ? usdcBalance.toFixed(6) : "0.000000"} {tokenLabel}
              </button>

              {/* Live fee & total summary: Amount + Network Gas + Gas (1%) + Network Fee = Total */}
              <div className="mt-3 space-y-1 text-xs text-muted-foreground border border-border/60 rounded-xl px-3 py-2 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span>Amount</span>
                  <span className="text-foreground font-medium">
                    {parseFloat(amount || "0").toFixed(6)} {tokenLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Network Gas</span>
                  <span className="text-foreground font-medium">
                    {gasFee.toFixed(6)} {tokenLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Network Gas (1%)</span>
                  <span className="text-foreground font-medium">
                    {gasFeeOnePercent.toFixed(6)} {tokenLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Network Fee</span>
                  <span className="text-foreground font-medium">
                    {networkFee.toFixed(6)} {tokenLabel}
                  </span>
                </div>
                <div className="pt-2 mt-2 border-t border-border/40">
                  <GasFeeDisplay chain={gasChain} className="text-xs" />
                </div>
                <div className="h-px bg-border/60 my-1" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-foreground font-bold">
                    {getTotalAmount()} {tokenLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border my-6" />

            <Button
              onClick={sendTransaction}
              className="w-full sm:w-auto h-12 px-8 rounded-xl text-base font-semibold"
              disabled={
                loading ||
                !amount ||
                parseFloat(amount) <= 0 ||
                gasFeeInTokens <= 0 ||
                (sendInputMode === "email" ? !recipientEmail?.trim() : !recipientWallet?.trim()) 
                // (usdcBalance !== null && usdcBalance <= 0)
              }
            >
              {loading ? "Processing..." : "Confirm Transfer"}
            </Button>

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

            {error && (
              <p className="mt-4 text-xs text-red-500 break-words">
                {error}
              </p>
            )}
            {txHash && (
              <p className="mt-2 text-xs text-green-600 break-words">
                Transaction sent! Hash: {txHash}
              </p>
            )}
            {url && (
              <p className="mt-1 text-xs text-blue-600 break-words">
                View transaction:{" "}
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {url}
                </a>
              </p>
            )}
          </div>
        </Card>
      </div>

      <AlertDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Email is not connected for receiving payments</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Would you like to invite this email to receive payments via Stabilee?</p>
              <p>
                The recipient will be able to receive funds securely. If they don't have an account yet, they'll be
                invited to set up access.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendInvite} className="rounded-xl">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Confirm Transfer</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 mt-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Recipient</span>
                    <span className="text-sm font-medium text-foreground">{recipientEmail}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Wallet Address</span>
                    <span className="text-xs font-mono text-foreground truncate max-w-[180px]">
                      {getRecipientWallet()}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Currency</span>
                    <span className="text-sm font-medium text-foreground">{tokenLabel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-sm font-medium text-foreground">
                      {parseFloat(amount || "0").toFixed(6)} {tokenLabel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Network Gas</span>
                    <span className="text-sm text-foreground">
                      {gasFee.toFixed(6)} {tokenLabel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Network Gas (1%)</span>
                    <span className="text-sm text-foreground">
                      {gasFeeOnePercent.toFixed(6)} {tokenLabel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Network Fee</span>
                    <span className="text-sm text-foreground">
                      {networkFee.toFixed(6)} {tokenLabel}
                    </span>
                  </div>
                  <div className="pt-1 pb-2">
                    <GasFeeDisplay chain={gasChain} className="text-xs" />
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">Total</span>
                    <span className="text-base font-bold text-foreground">
                      {getTotalAmount()} {tokenLabel}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Self-Custody Notice:</strong> This is a non-custodial transfer. You are responsible for
                    ensuring the recipient address is correct. Transactions on the blockchain are irreversible.
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  By confirming, you acknowledge that you are initiating a transfer on the Base network and understand
                  that blockchain transactions cannot be reversed.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalConfirm} className="rounded-xl">
              Confirm & Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>;
};
export default Transactions;