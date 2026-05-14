import type { GetCurrentUserResponse } from "@/api/generated";
import type { AuthUser } from "@/components/auth-provider";

export const sessionQueryKey = ["auth", "session"] as const;
export const currentUserQueryKey = ["current-user"] as const;

export async function fetchSessionQuery() {
  const response = await fetch("/api/auth/session");

  if (!response.ok) {
    throw new Error("Unable to load session");
  }

  return (await response.json()) as AuthUser;
}

export async function fetchCurrentUserQuery() {
  const response = await fetch("/api/proxy/v1/users/me");

  if (!response.ok) {
    throw new Error("Unable to load current user");
  }

  return (await response.json()) as GetCurrentUserResponse;
}
