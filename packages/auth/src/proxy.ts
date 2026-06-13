import { authkitProxy } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { isLocalDevAuthBypass, isWorkOSConfigured } from "./index";

export const authProxyMatcher = [
  "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  "/(api|trpc)(.*)",
];

export function makeAuthProxy() {
  return function proxy(request: NextRequest, event: NextFetchEvent) {
    if (isLocalDevAuthBypass() || !isWorkOSConfigured()) {
      return NextResponse.next();
    }

    return authkitProxy({
      redirectUri:
        process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI || `${request.nextUrl.origin}/callback`,
    })(request, event);
  };
}
