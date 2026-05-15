const STORAGE_KEY = "modulith.twoFactorChallenge";

export type TwoFactorChallenge = {
  challengeToken: string;
  expiresAt: string;
  nextPath?: string | null;
};

export function saveTwoFactorChallenge(challenge: TwoFactorChallenge) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(challenge));
}

export function readTwoFactorChallenge(): TwoFactorChallenge | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as TwoFactorChallenge;
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      clearTwoFactorChallenge();
      return null;
    }
    return parsed;
  } catch {
    clearTwoFactorChallenge();
    return null;
  }
}

export function clearTwoFactorChallenge() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
