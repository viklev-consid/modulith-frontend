import type { GoogleLoginResponse } from "@/api/generated";
import {
  fetchBackend,
  getHasCompletedOnboarding,
  problemResponse,
  publicUser,
  readJsonBody,
  sessionFromTokenResponse,
} from "@/lib/backend";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const response = await fetchBackend("/v1/users/auth/google/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });

  if (!response.ok && response.status !== 202) {
    return problemResponse(response);
  }

  if (response.status === 202) {
    const pending = await response.json();
    return Response.json(pending, { status: 202 });
  }

  const payload = (await response.json()) as GoogleLoginResponse;

  if (payload.status === "twoFactorRequired" && payload.challenge) {
    return Response.json({
      status: "TwoFactorRequired",
      challengeToken: payload.challenge.challengeToken,
      expiresAt: payload.challenge.expiresAt,
    });
  }

  if (payload.status !== "authenticated" || !payload.session) {
    return Response.json(
      {
        title: "Unexpected Google sign-in response",
        status: 502,
      },
      { status: 502, headers: { "content-type": "application/problem+json" } },
    );
  }

  const nextSession = sessionFromTokenResponse(payload.session);
  const session = await getSession();
  Object.assign(session, nextSession, {
    hasCompletedOnboarding: await getHasCompletedOnboarding(
      nextSession.accessToken,
    ),
  });
  await session.save();

  return Response.json({
    status: "Authenticated",
    user: publicUser(nextSession.user),
  });
}
