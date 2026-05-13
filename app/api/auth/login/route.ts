import {
  fetchBackend,
  problemResponse,
  publicUser,
  readJsonBody,
  sessionFromTokenResponse,
  type TokenResponse,
} from "@/lib/backend";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const response = await fetchBackend("/v1/users/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });

  if (!response.ok) {
    return problemResponse(response);
  }

  const nextSession = sessionFromTokenResponse(
    (await response.json()) as TokenResponse,
  );
  const session = await getSession();
  Object.assign(session, nextSession);
  await session.save();

  return Response.json(publicUser(nextSession.user));
}
