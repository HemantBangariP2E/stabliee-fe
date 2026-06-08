function envelope(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  return data as Record<string, unknown>;
}

function unwrapObject(data: unknown): Record<string, unknown> {
  const d = envelope(data);
  const inner = d.result ?? d.data ?? d;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return d;
}

function parseScalarBalance(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = parseFloat(value.trim());
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Parse `POST /v2/wallet/balance` response into a numeric token balance. */
export function parseBalanceNumber(data: unknown): number {
  if (typeof data === "string" || typeof data === "number") {
    const n = parseScalarBalance(data);
    if (n !== null) return n;
  }

  const o = unwrapObject(data);
  const token = o.token;
  if (token && typeof token === "object" && !Array.isArray(token)) {
    const bal = parseScalarBalance((token as Record<string, unknown>).balance);
    if (bal !== null) return bal;
  }

  for (const key of ["balance", "amount", "value", "formattedBalance", "result"] as const) {
    const bal = parseScalarBalance(o[key]);
    if (bal !== null) return bal;
  }

  throw new Error("Could not parse balance from API response");
}
