import { fetchBackend, problemResponse, readJsonBody } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const response = await fetchBackend("/v1/users/email/confirmation/resend", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });

  if (!response.ok) {
    return problemResponse(response);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "content-type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}
