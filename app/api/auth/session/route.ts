import { publicUser } from "@/lib/backend";
import { getSession, hasUsableSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!hasUsableSession(session) || !session.user) {
    return Response.json(
      { title: "Unauthorized", status: 401 },
      { status: 401 },
    );
  }

  return Response.json(publicUser(session.user));
}
