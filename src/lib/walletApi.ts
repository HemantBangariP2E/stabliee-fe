const normalizeBase = (u: string | undefined) => (u?.trim().replace(/\/$/, "") ?? "");

function buildUrl(root: string, path: string): string {
  const p = path.replace(/^\//, "");
  const r = normalizeBase(root);
  if (!r) return `/${p}`;
  return `${r}/${p}`;
}

async function readJsonWrappedResponse<T>(res: Response, requestUrl: string): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${res.status}: ${text.trim() || res.statusText} (${requestUrl})`);
  }
  if (!text.trim()) {
    throw new Error(`Empty response from ${requestUrl}`);
  }
  const raw = JSON.parse(text) as Record<string, unknown>;
  return (raw.result ?? raw) as T;
}

/** Same host as custodial-daaps / embedded wallet (`POST /v2/wallet/balance`). */
export function getWalletApiBase(): string {
  return (
    normalizeBase(import.meta.env.VITE_CREATE_WALLET_BASE_URL as string | undefined) ||
    normalizeBase(import.meta.env.VITE_KALP_WALLET_API_BASE_URL as string | undefined) ||
    normalizeBase(import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    "https://alpha-wallet-api.kalp.studio"
  );
}

/** Project / widget API key (`apikey` header). */
export function getKalpWalletApiKey(): string {
  if (typeof window !== "undefined") {
    for (const key of ["apiKey", "apikey", "widgetApiKey", "projectApiKey"]) {
      const stored = localStorage.getItem(key);
      if (stored?.trim()) return stored.trim();
    }
  }
  const fromEnv = import.meta.env.VITE_KALP_WALLET_API_KEY as string | undefined;
  if (fromEnv?.trim()) return fromEnv.trim();
  return "cce4c35335c02307321678e3a8374bd2cf477a188850d253ace283690a827919";
}

/** Base URL for the root KS backend (embedded-wallet config, chains, etc.) */
export function getRootApiBase(): string {
  return (
    normalizeBase(import.meta.env.VITE_ROOT_API_BASE_URL as string | undefined) ||
    normalizeBase(import.meta.env.VITE_KALP_WALLET_API_BASE_URL as string | undefined) ||
    "https://qa-ks-root-be.kalp.studio/api/v1"
  );
}

/** Project ID for the embedded wallet config. */
export function getProjectId(): string {
  return (
    (import.meta.env.VITE_PROJECT_ID as string | undefined)?.trim() ||
    localStorage.getItem("projectId") ||
    ""
  );
}

export type ChainEntry = {
  id: number;
  blockchain: string;
  network: string;
  rpcProvider: string;
  rpcUrl: string;
  chainId: string;
  explorerUrl: string;
  currency: string;
  logo: string;
  permissions: string[];
  isEnabled: boolean;
};

export type EmbeddedWalletConfig = {
  id: string;
  projectId: string;
  isMpcWallet: boolean;
  isSmartWallet: boolean;
  blockchainNetworkConfig: { chainId: string; network: string; blockchain: string }[];
  chainsAndNetworks: {
    MAINNET?: { chains: ChainEntry[] };
    TESTNET?: { chains: ChainEntry[] };
  };
};

/**
 * Fetch the embedded wallet config (includes chainsAndNetworks for the project).
 * GET /embedded-wallet/project/{projectId}
 */
export async function fetchEmbeddedWalletConfig(
  projectId?: string,
): Promise<EmbeddedWalletConfig | null> {
  const pid = projectId || getProjectId();
  if (!pid) return null;
  try {
    const base = getRootApiBase();
    const url = buildUrl(base, `embedded-wallet/project/${pid}`);
    const apiKey = getKalpWalletApiKey();
    const res = await fetch(url, {
      headers: {
        apikey: apiKey,
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });
    const text = await res.text();
    if (!res.ok || !text.trim()) return null;
    const json = JSON.parse(text) as Record<string, unknown>;
    return ((json.result ?? json) as EmbeddedWalletConfig) ?? null;
  } catch {
    return null;
  }
}

/**
 * Return only the chains that are in blockchainNetworkConfig (the ones the
 * project admin actually selected), enriched with full details from chainsAndNetworks.
 */
export function getEnabledChainsFromConfig(cfg: EmbeddedWalletConfig): ChainEntry[] {
  const selected = cfg.blockchainNetworkConfig ?? [];
  if (!selected.length) return [];

  const allChains: ChainEntry[] = [
    ...(cfg.chainsAndNetworks?.MAINNET?.chains ?? []),
    ...(cfg.chainsAndNetworks?.TESTNET?.chains ?? []),
  ];

  // Match each blockchainNetworkConfig entry to its full chain details
  return selected
    .map((sel) =>
      allChains.find(
        (c) => c.chainId === sel.chainId && c.network === sel.network
      ) ??
      // Fallback: build a minimal ChainEntry from the config entry alone
      ({
        id: 0,
        blockchain: sel.blockchain,
        network: sel.network,
        rpcProvider: "",
        rpcUrl: "",
        chainId: sel.chainId,
        explorerUrl: "",
        currency: sel.blockchain,
        logo: "",
        permissions: ["DEFAULT"],
        isEnabled: true,
      } as ChainEntry)
    );
}

export async function apiPost<T>(
  path: string,
  body: Record<string, unknown>,
  opts?: { baseUrl?: string; apiKey?: string },
): Promise<T> {
  const root = normalizeBase(opts?.baseUrl ?? getWalletApiBase()) || "";
  const url = buildUrl(root, path);
  const apiKey = (opts?.apiKey ?? getKalpWalletApiKey()).trim();
  if (!apiKey) {
    throw new Error("Missing API key for wallet balance request");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(body),
  });

  return readJsonWrappedResponse<T>(res, url);
}
