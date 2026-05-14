import "server-only";

import type { GetCurrentUserResponse } from "@/api/generated";
import { fetchBackend, publicUser, refreshSession } from "@/lib/backend";
import { getSession, hasUsableSession } from "@/lib/session";

export async function getUsableServerSession() {
  const session = await getSession();

  if (!hasUsableSession(session)) {
    return null;
  }

  if (session.expiresAt && session.expiresAt * 1000 - Date.now() < 60_000) {
    const nextSession = await refreshSession(session);

    if (!nextSession) {
      session.destroy();
      await session.save();
      return null;
    }

    Object.assign(session, nextSession);
    await session.save();
  }

  return session;
}

export async function getServerSessionUser() {
  const session = await getUsableServerSession();

  if (!session?.user) {
    return null;
  }

  return publicUser(session.user);
}

export async function getServerCurrentUser() {
  const session = await getUsableServerSession();

  if (!session) {
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

export async function syncServerOnboardingState(
  hasCompletedOnboarding: boolean,
) {
  const session = await getSession();

  if (!hasUsableSession(session)) {
    return;
  }

  if (session.hasCompletedOnboarding === hasCompletedOnboarding) {
    return;
  }

  session.hasCompletedOnboarding = hasCompletedOnboarding;
  await session.save();
}
