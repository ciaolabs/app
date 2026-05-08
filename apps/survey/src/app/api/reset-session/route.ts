import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = process.env.WORKOS_COOKIE_NAME ?? "wos-session";

// Clears the WorkOS session cookie and redirects home.
// Useful for users stuck in a 494 loop caused by an oversized session cookie.
// Navigate directly to /api/reset-session to escape without JS or RSC headers.
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));

  response.cookies.delete(SESSION_COOKIE_NAME);
  for (let i = 0; i < 10; i++) {
    response.cookies.delete(`${SESSION_COOKIE_NAME}.${i}`);
  }

  return response;
}
