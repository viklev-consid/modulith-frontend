const STORAGE_KEY = "modulith.twoFactorChallenge";

export type TwoFactorChallenge = {
  challengeToken: string;
  expiresAt: string;
  nextPath?: string | null;
};

// Cache so useSyncExternalStore receives a stable reference between snapshot
// reads — without it React would re-render every microtask since JSON.parse
// returns a fresh object each call.
let cachedRaw: string | null | undefined;
let cachedParsed: TwoFactorChallenge | null = null;

function parseRaw(raw: string | null): TwoFactorChallenge | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TwoFactorChallenge;
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readSnapshot(): TwoFactorChallenge | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedParsed;
  cachedRaw = raw;
  cachedParsed = parseRaw(raw);
  if (raw && !cachedParsed) {
    // Stored value was expired or malformed — purge it so we don't hand it
    // back next call.
    window.sessionStorage.removeItem(STORAGE_KEY);
    cachedRaw = null;
  }
  return cachedParsed;
}

export function getTwoFactorChallengeSnapshot() {
  return readSnapshot();
}

export function getTwoFactorChallengeServerSnapshot(): TwoFactorChallenge | null {
  return null;
}

export function subscribeTwoFactorChallenge(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      cachedRaw = undefined;
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function saveTwoFactorChallenge(challenge: TwoFactorChallenge) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(challenge));
  cachedRaw = undefined; // invalidate same-tab cache
}

export function readTwoFactorChallenge(): TwoFactorChallenge | null {
  return readSnapshot();
}

export function clearTwoFactorChallenge() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  cachedRaw = undefined;
  cachedParsed = null;
}
