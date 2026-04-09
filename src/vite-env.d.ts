/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_KALP_WALLET_API_URL?: string;
  readonly VITE_KALP_TRANSFER_LIMIT?: string;
  readonly VITE_KALP_MAX_BATCHES?: string;
  readonly VITE_ETH_SEPOLIA_RPC?: string;
  readonly VITE_ETH_MAINNET_RPC?: string;
  readonly VITE_ALCHEMY_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
