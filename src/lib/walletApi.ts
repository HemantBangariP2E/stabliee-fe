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
