export type GoogleCredentialClaims = {
  picture?: string;
  email?: string;
  name?: string;
};

export function decodeGoogleCredential(
  credential: string,
): GoogleCredentialClaims | null {
  const parts = credential.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const payload = parts[1];
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const decoded =
      typeof window === "undefined"
        ? Buffer.from(padded, "base64").toString("utf8")
        : atob(padded);
    const json =
      typeof window === "undefined"
        ? decoded
        : decodeURIComponent(
            decoded
              .split("")
              .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
              .join(""),
          );
    return JSON.parse(json) as GoogleCredentialClaims;
  } catch {
    return null;
  }
}
