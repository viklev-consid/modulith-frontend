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

function isPublicRoute(pathname: string) {
  return (
    publicRoutes.has(pathname) || pathname.startsWith("/auth/google/confirm")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await unsealSessionCookie(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
  const hasSession = Boolean(session && hasUsableSession(session));

  if (!hasSession && !isPublicRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    hasSession &&
    session?.hasCompletedOnboarding !== true &&
    pathname !== "/onboarding" &&
    !isPublicRoute(pathname)
  ) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
