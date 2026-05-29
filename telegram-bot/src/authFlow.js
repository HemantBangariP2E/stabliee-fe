/** Auth response parsing (Kalp wallet API). */

function asRecord(v) {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  return {};
}

export function unwrapAuthStatus(data) {
  let flat = { ...data };
  const topStatus = flat.status;
  if (topStatus && typeof topStatus === 'object' && !Array.isArray(topStatus)) {
    flat = { ...flat, ...topStatus };
  }
  const result = flat.result;
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    flat = { ...flat, ...result };
    const innerStatus = result.status;
    if (innerStatus && typeof innerStatus === 'object' && !Array.isArray(innerStatus)) {
      flat = { ...flat, ...innerStatus };
    }
  }
  return flat;
}

export function extractWalletAddress(data) {
  const flat = unwrapAuthStatus(data);
  for (const key of ['ownerAddress', 'owner_address', 'walletAddress', 'wallet_address', 'address']) {
    const v = flat[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

export function parseAuthVerifyResult(data) {
  const raw = asRecord(data);
  const flat = unwrapAuthStatus(raw);
  const existingWalletAddress = extractWalletAddress(flat);
  const httpOk = typeof raw.status === 'number' && raw.status === 200;
  const verified =
    httpOk ||
    flat.success === true ||
    (typeof flat.message === 'string' && /verified|exists|success/i.test(flat.message)) ||
    !!existingWalletAddress;

  const shard =
    (typeof flat.userShard === 'string' && flat.userShard.trim()) ||
    (typeof flat.user_shard === 'string' && flat.user_shard.trim()) ||
    (typeof flat.newClientShare === 'string' && flat.newClientShare.trim()) ||
    undefined;

  return {
    verified: verified || !!existingWalletAddress,
    existingWalletAddress: existingWalletAddress || undefined,
    userShard: shard,
  };
}

export function walletFromVerifyResult(verifyResult) {
  const address = verifyResult.existingWalletAddress?.trim();
  if (!address) return null;
  return { address, userShard: verifyResult.userShard };
}
