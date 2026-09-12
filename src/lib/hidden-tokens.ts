const STORAGE_PREFIX = "basemate.hiddenTokens.v1";

export function coinHideKey(tokenAddress: string | null, symbol: string): string {
  return (tokenAddress ?? symbol).trim().toLowerCase();
}

function storageKey(wallet: string): string {
  return `${STORAGE_PREFIX}:${wallet.toLowerCase()}`;
}

export function readHiddenTokens(wallet: string | null | undefined): string[] {
  if (!wallet || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(wallet));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.length > 0);
  } catch {
    return [];
  }
}

export function writeHiddenTokens(wallet: string, keys: string[]): void {
  if (typeof window === "undefined") return;
  const unique = [...new Set(keys.map((k) => k.toLowerCase()))];
  window.localStorage.setItem(storageKey(wallet), JSON.stringify(unique));
}
