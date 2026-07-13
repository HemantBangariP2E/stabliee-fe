/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALCHEMY_KEY?: string;
  readonly VITE_KALP_WALLET_API_KEY?: string;
  readonly VITE_DEFAULT_CHAIN_ID?: string;
  readonly VITE_CREATE_WALLET_BASE_URL?: string;
  readonly VITE_KALP_WALLET_API_BASE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
