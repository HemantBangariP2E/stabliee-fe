import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseAuthVerifyResult } from './authFlow.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_BASE = (
  process.env.VITE_WALLET_API_URL ||
  process.env.WALLET_API_URL ||
  'https://alpha-wallet-api.kalp.studio/'
).replace(/\/?$/, '/');

const CHAINS = {
  'eth-sepolia': {
    id: 'eth-sepolia',
    label: 'Ethereum Sepolia',
    blockchain: 'ETH',
    network: 'SEPOLIA',
    chainId: 11155111,
  },
  'base-sepolia': {
    id: 'base-sepolia',
    label: 'Base Sepolia',
    blockchain: 'BASE',
    network: 'SEPOLIA',
    chainId: 84532,
  },
};

function getChain() {
  const key = (process.env.STABLIEe_BOT_CHAIN || 'eth-sepolia').trim().toLowerCase();
  return CHAINS[key] || CHAINS['eth-sepolia'];
}

function walletType() {
  // Stabliee web sends via executeMPCTokenTxn + ownerAddress (MPC), not SMART_WALLET.
  return (process.env.STABLIEe_WALLET_TYPE || 'MPC').trim();
}

/** Prefer MPC when the user already has one (matches Stabliee app). */
export function resolveAuthWalletType(existence) {
  if (existence?.isMPCExists) return 'MPC';
  if (existence?.isSmartWalletExists) return 'SMART_WALLET';
  return walletType();
}

function apiKey() {
  const key =
    process.env.VITE_WALLET_API_KEY ||
    process.env.WALLET_API_KEY ||
    '';
  if (!key.trim()) throw new Error('VITE_WALLET_API_KEY missing in .env');
  return key.trim();
}

async function readJson(response) {
  const text = await response.text();
  if (!text.trim()) return {};
  return JSON.parse(text);
}

export async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path.replace(/^\//, '')}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apiKey: apiKey() },
    body: JSON.stringify(body),
  });
  const data = await readJson(response);
  const apiStatus = typeof data.status === 'number' ? data.status : data.httpStatus;
  const failed = !response.ok || (apiStatus !== undefined && apiStatus !== 200);
  if (failed) {
    const msg = data.message || `API error (${response.status})`;
    if (/custodial/i.test(String(msg))) {
      throw new Error(
        `${msg} Stabliee transfers need an MPC wallet: set STABLIEe_WALLET_TYPE=MPC in .env, restart the bot, and /login again with the same phone as the app.`,
      );
    }
    throw new Error(msg);
  }
  return data;
}

export function getChainLabel() {
  return getChain().label;
}

export function normalizePhone(input) {
  const digits = input.replace(/\D/g, '');
  if (digits.length <= 10) return { countryCode: '91', phone: digits };
  if (digits.length === 12 && digits.startsWith('91')) {
    return { countryCode: '91', phone: digits.slice(2) };
  }
  return { countryCode: digits.slice(0, 2), phone: digits.slice(2) };
}

export async function checkWalletExists(walletIdentifier) {
  const chain = getChain();
  const data = await apiPost('auth/is-mpc-exist', {
    blockchain: chain.blockchain,
    network: chain.network,
    walletIdentifier,
  });
  return {
    isMPCExists: data.result?.isMPCExists ?? false,
    isSmartWalletExists: data.result?.isSmartWalletExists ?? false,
  };
}

export async function sendPhoneOtp({ countryCode, phone, userId, type, authWalletType }) {
  const chain = getChain();
  await apiPost('auth/phone/send', {
    countryCode,
    phone,
    userId,
    walletType: authWalletType || walletType(),
    type: type || 'sign_in',
    blockchain: chain.blockchain,
    network: chain.network,
  });
}

export async function verifyPhoneOtp({ countryCode, phone, otp, userId, type, authWalletType }) {
  const chain = getChain();
  const response = await fetch(`${API_BASE}auth/phone/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apiKey: apiKey() },
    body: JSON.stringify({
      countryCode,
      phone,
      otp,
      userId,
      walletType: authWalletType || walletType(),
      type: type || 'sign_in',
      blockchain: chain.blockchain,
      network: chain.network,
    }),
  });
  const data = await readJson(response);
  const parsed = parseAuthVerifyResult(data);
  if (!response.ok) throw new Error(data.message || 'Verification failed');
  if (!parsed.verified) throw new Error('OTP verification failed');
  return parsed;
}

export async function createSmartWallet(userId, authWalletType) {
  const chain = getChain();
  const data = await apiPost('v2/wallet/create-wallet', {
    userId,
    walletType: authWalletType || walletType(),
    blockchain: chain.blockchain,
    network: chain.network,
    chainId: chain.chainId,
  });
  const address = data.result?.address || data.result?.walletAddress || '';
  if (!address) throw new Error('No wallet address returned');
  return { address, userShard: data.result?.userShard };
}

/**
 * Stabliee platform fee wallet (gas + 1% markup) — hardcoded like Transactions.tsx.
 * Recipient `to` gets the transfer amount; feeRecipient gets feeAmount in USDT.
 */
const FEE_RECIPIENT = {
  'eth-sepolia': '0xaAEd3fCdDEDA26F9AD0582698d9Be012e48D88aF',
  'base-sepolia': '0x3eF4Bd3948976bD4Af03003E5bC0e109E016d563',
};

const PLATFORM_FEE_ON_GAS = 0.01;

/** Stablecoin contracts — same as stabliee-fe/src/pages/Transactions.tsx */
const STABLE_TOKENS = {
  'eth-sepolia': {
    address: '0x5aEC77A2CBE8ee9D359F965826BdDFa026DfFb38',
    symbol: 'USDT',
    decimals: 6,
  },
  'base-sepolia': {
    address: '0x28bD35b56bfCa732C7DF2F2d08312169189605A8',
    symbol: 'USDT',
    decimals: 6,
  },
};

function tokenConfig() {
  const chainKey = getChain().id;
  const defaults = STABLE_TOKENS[chainKey] || STABLE_TOKENS['eth-sepolia'];
  const addr =
    process.env.VITE_STABLE_TOKEN_ADDRESS ||
    process.env.STABLE_TOKEN_ADDRESS ||
    defaults.address;
  const symbol = process.env.STABLE_TOKEN_SYMBOL || defaults.symbol;
  const decimals = Number(
    process.env.STABLE_TOKEN_DECIMALS || defaults.decimals,
  );
  return { addr: addr.trim(), symbol, decimals };
}

/** USDT/stable only — no native ETH line in the bot UI. */
export async function fetchBalances(address) {
  const chain = getChain();
  const tok = tokenConfig();
  const tokenRes = await apiPost('v2/wallet/balance', {
    address,
    chainId: chain.chainId,
    blockchain: chain.blockchain,
    network: chain.network,
    currency: tok.symbol,
    smartContractAddress: tok.addr,
  });
  const t = tokenRes.result?.token;
  const stable =
    t?.balance != null ? `${t.balance} ${t.symbol || tok.symbol}` : `0 ${tok.symbol}`;
  return { stable };
}

export function getHardcodedFeeRecipient() {
  const chain = getChain();
  return (
    process.env.STABLIEe_FEE_RECIPIENT?.trim() ||
    FEE_RECIPIENT[chain.id] ||
    FEE_RECIPIENT['eth-sepolia']
  );
}

/** Gas fee in USDT + 1% platform fee on gas (matches Transactions.tsx). */
export async function computeStablieeSendFees(fromAddress, to, amount) {
  const chain = getChain();
  const tok = tokenConfig();
  let gasFeeUsdt = Number(process.env.STABLIEe_BOT_GAS_FEE_USDT || '0.05');

  try {
    const est = await apiPost('v2/wallet/estimate-gas', {
      chainId: chain.chainId,
      from: fromAddress.trim(),
      to: to.trim(),
      amount,
      smartContractAddress: tok.addr,
    });
    const raw = est.result ?? est;
    const costEth = parseFloat(
      String(raw.estimatedCostEth ?? raw.estimatedCost ?? '0').replace(/[^\d.]/g, ''),
    );
    if (Number.isFinite(costEth) && costEth > 0) {
      const ethUsd = Number(process.env.STABLIEe_ETH_USD_PRICE || '2500');
      gasFeeUsdt = Math.max(gasFeeUsdt, costEth * ethUsd);
    }
  } catch {
    /* use default gasFeeUsdt */
  }

  const platformFee = gasFeeUsdt * PLATFORM_FEE_ON_GAS;
  const feeAmount = gasFeeUsdt + platformFee;

  return {
    gasFeeUsdt: round6(gasFeeUsdt),
    platformFee: round6(platformFee),
    feeAmount: round6(feeAmount),
    feeRecipient: getHardcodedFeeRecipient(),
    totalDebited: round6(amount + feeAmount),
  };
}

function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

/**
 * Stabliee send: POST /relayer/send-transaction-with-fee
 * - `to` = recipient (full USDT amount)
 * - `feeRecipient` = platform wallet (gas + 1% fee in USDT)
 */
export async function sendGaslessTransfer({
  fromAddress,
  to,
  amount,
  userShard,
  userIdentity,
  feeBreakdown,
}) {
  const chain = getChain();
  const tok = tokenConfig();
  const fees = feeBreakdown ?? (await computeStablieeSendFees(fromAddress, to, amount));

  const payload = {
    fromAddress: fromAddress.trim(),
    to: to.trim(),
    amount,
    chainId: chain.chainId,
    tokenAddress: tok.addr,
    tokenDecimals: tok.decimals,
    feeRecipient: fees.feeRecipient,
    feeAmount: fees.feeAmount,
    currency: tok.symbol,
    userShard,
    userIdentity,
    referenceNo: crypto.randomUUID(),
  };

  const data = await apiPost('relayer/send-transaction-with-fee', payload);
  const r = data.result ?? data;
  return {
    txHash: r?.txHash || r?.hash,
    message: r?.message,
    status: r?.status,
    fees,
    transferAmount: amount,
    feeRecipient: fees.feeRecipient,
    feeAmount: fees.feeAmount,
  };
}

export function defaultStableSymbol() {
  return tokenConfig().symbol;
}
