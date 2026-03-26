/**
 * Scopes Supabase `user_logins` rows so the same email can have one wallet per chain
 * (e.g. Base Sepolia + Ethereum Sepolia).
 */
export function getAccountChainId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("chainIdConfig")?.trim() || "";
}
