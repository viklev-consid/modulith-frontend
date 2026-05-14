import "server-only";

import type { GetCurrentUserResponse } from "@/api/generated";
import { fetchBackend, publicUser } from "@/lib/backend";
import { getSession, hasUsableSession } from "@/lib/session";

export async function getServerSessionUser() {
  const session = await getSession();

  if (!hasUsableSession(session) || !session.user) {
    return null;
  }

  return publicUser(session.user);
}

export async function getServerCurrentUser() {
  const session = await getSession();

  if (!hasUsableSession(session)) {
    return null;
  }

  const response = await fetchBackend("/v1/users/me", {
    headers: {
      authorization: `Bearer ${session.accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as GetCurrentUserResponse;
}
