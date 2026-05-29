const wallets = new Map();

export function getWallet(telegramUserId) {
  return wallets.get(String(telegramUserId)) || null;
}

export function saveWallet(telegramUserId, data) {
  wallets.set(String(telegramUserId), { ...data, updatedAt: Date.now() });
}

export function clearWallet(telegramUserId) {
  wallets.delete(String(telegramUserId));
}

export function isLoggedIn(telegramUserId) {
  const w = getWallet(telegramUserId);
  return !!(w?.walletAddress && w?.userShard);
}
