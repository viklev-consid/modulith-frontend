import { backendFetch, backendUrl, refreshSession } from "@/lib/backend";
import { getSession, hasUsableSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type ProxyContext = {
  params: Promise<{
    path: string[];
  }>;
};

const hopByHopHeaders = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
]);

async function proxyRequest(request: Request, context: ProxyContext) {
  const session = await getSession();

  if (!hasUsableSession(session)) {
    return Response.json(
      { title: "Unauthorized", status: 401 },
      { status: 401 },
    );
  }

  if (session.expiresAt && session.expiresAt * 1000 - Date.now() < 60_000) {
    const nextSession = await refreshSession(session);

    if (!nextSession) {
      session.destroy();
      return Response.json(
        { title: "Unauthorized", status: 401 },
        { status: 401 },
      );
    }

    Object.assign(session, nextSession);
    await session.save();
  }

  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const target = new URL(backendUrl(path.join("/")));
  target.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  headers.set("authorization", `Bearer ${session.accessToken}`);
  headers.delete("host");
  headers.delete("cookie");

  const response = await backendFetch(target, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    duplex: "half",
    cache: "no-store",
  } as RequestInit & { duplex: "half" });

  const responseHeaders = new Headers(response.headers);
  for (const header of hopByHopHeaders) {
    responseHeaders.delete(header);
  }

  const contentType = responseHeaders.get("content-type");
  if (contentType?.includes("text/event-stream")) {
    responseHeaders.set("cache-control", "no-cache");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
