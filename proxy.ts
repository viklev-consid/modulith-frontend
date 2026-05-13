import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { hasUsableSession, unsealSessionCookie } from "@/lib/session";

const publicRoutes = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/confirm-email",
  "/goodbye",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicRoutes.has(pathname);
  const session = await unsealSessionCookie(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
  const hasSession = Boolean(session && hasUsableSession(session));

  if (!hasSession && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
