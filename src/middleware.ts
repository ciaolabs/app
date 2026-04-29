import { authkitMiddleware } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

function isWorkOSMiddlewareConfigured() {
  return Boolean(
    process.env.WORKOS_API_KEY &&
      process.env.WORKOS_CLIENT_ID &&
      process.env.WORKOS_COOKIE_PASSWORD &&
      process.env.WORKOS_COOKIE_PASSWORD.length >= 32,
  );
}

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!isWorkOSMiddlewareConfigured()) {
    return NextResponse.next();
  }

  return authkitMiddleware({
    redirectUri:
      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ?? `${request.nextUrl.origin}/callback`,
  })(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
