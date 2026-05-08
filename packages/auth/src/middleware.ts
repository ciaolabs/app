import { authkitMiddleware } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { isWorkOSConfigured } from "./index";

export const authMiddlewareMatcher = [
  "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  "/(api|trpc)(.*)",
];

const COOKIE_SIZE_LIMIT = 4096;
const SESSION_COOKIE_NAME = process.env.WORKOS_COOKIE_NAME ?? "wos-session";

function hasoversizedCookies(request: NextRequest): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (cookieHeader.length <= COOKIE_SIZE_LIMIT) return false;

  // Only clear if the WorkOS session cookie itself is oversized
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  return sessionCookie !== undefined && cookieHeader.length > COOKIE_SIZE_LIMIT;
}

function clearSessionAndRedirect(request: NextRequest): NextResponse {
  const signInUrl = new URL("/sign-in", request.nextUrl.origin);
  const response = NextResponse.redirect(signInUrl);
  response.cookies.delete(SESSION_COOKIE_NAME);
  // Also clear chunked cookies (wos-session.0, wos-session.1, etc.)
  for (let i = 0; i < 10; i++) {
    response.cookies.delete(`${SESSION_COOKIE_NAME}.${i}`);
  }
  return response;
}

export function makeAuthMiddleware() {
  return function middleware(request: NextRequest, event: NextFetchEvent) {
    if (!isWorkOSConfigured()) {
      return NextResponse.next();
    }

    if (hasoversizedCookies(request)) {
      return clearSessionAndRedirect(request);
    }

    return authkitMiddleware({
      redirectUri:
        process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI || `${request.nextUrl.origin}/callback`,
    })(request, event);
  };
}
