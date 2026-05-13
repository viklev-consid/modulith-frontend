import {
  fetchBackend,
  getHasCompletedOnboarding,
  problemResponse,
  publicUser,
  readJsonBody,
  sessionFromTokenResponse,
  type TokenResponse,
} from "@/lib/backend";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type GoogleLoginResponse = Partial<TokenResponse> & {
  isPending?: boolean;
  status?: string;
  pendingToken?: string;
  email?: string;
  displayName?: string;
};

function hasTokenResponse(body: GoogleLoginResponse): body is TokenResponse {
  return Boolean(
    body.accessToken && body.refreshToken && body.accessTokenExpiresAt,
  );
}

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

  const googleResponse = (await response.json()) as GoogleLoginResponse;

  if (response.status === 202 || googleResponse.isPending) {
    return Response.json(googleResponse, { status: 202 });
  }

  if (!hasTokenResponse(googleResponse)) {
    return Response.json(
      {
        title: "Google sign-in pending",
        status: 202,
        detail: "Check your email to confirm this Google sign-in.",
      },
      { status: 202 },
    );
  }

  const nextSession = sessionFromTokenResponse(googleResponse);
  const session = await getSession();
  Object.assign(session, nextSession, {
    hasCompletedOnboarding: await getHasCompletedOnboarding(
      nextSession.accessToken,
    ),
  });
  await session.save();

  return Response.json(publicUser(nextSession.user));
}
