import { authkitProxy } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { isLocalDevAuthBypass, isWorkOSConfigured } from "./index";

export const authProxyMatcher = [
  "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  "/(api|trpc)(.*)",
];

/**
 * Client-readable hint that a WorkOS session cookie exists. The session cookie
 * itself is HttpOnly, so without this the client provider would have to fire a
 * session-check server action for every visitor — including the signed-out
 * majority on the static landing page, who cannot possibly have a session.
 * The hint is set/cleared here so it tracks the real cookie within one request.
 */
export const SESSION_HINT_COOKIE = "has-session";

function sessionCookieName() {
  return process.env.WORKOS_COOKIE_NAME || "wos-session";
}

export function makeAuthProxy() {
  return async function proxy(request: NextRequest, event: NextFetchEvent) {
    if (isLocalDevAuthBypass() || !isWorkOSConfigured()) {
      return NextResponse.next();
    }

    const response =
      (await authkitProxy({
        redirectUri:
          process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI || `${request.nextUrl.origin}/callback`,
      })(request, event)) ?? NextResponse.next();

    // Sync the hint with the session cookie. Only touch Set-Cookie on
    // transitions (sign-in/sign-out boundaries) so steady-state responses —
    // in particular the CDN-cached static pages — carry no cookie headers.
    const hasSession = request.cookies.has(sessionCookieName());
    const hasHint = request.cookies.get(SESSION_HINT_COOKIE)?.value === "1";

    if (hasSession && !hasHint) {
      response.headers.append(
        "set-cookie",
        `${SESSION_HINT_COOKIE}=1; Path=/; Max-Age=34560000; SameSite=Lax; Secure`,
      );
    } else if (!hasSession && hasHint) {
      response.headers.append(
        "set-cookie",
        `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure`,
      );
    }

    return response;
  };
}
