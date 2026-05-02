import { authkitMiddleware } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { isWorkOSConfigured } from "./index";

export const authMiddlewareMatcher = [
  "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  "/(api|trpc)(.*)",
];

export function makeAuthMiddleware() {
  return function middleware(request: NextRequest, event: NextFetchEvent) {
    if (!isWorkOSConfigured()) {
      return NextResponse.next();
    }

    return authkitMiddleware({
      redirectUri:
        process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ?? `${request.nextUrl.origin}/callback`,
    })(request, event);
  };
}
