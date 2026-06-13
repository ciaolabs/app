import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = process.env.WORKOS_COOKIE_NAME ?? "wos-session";
const SESSION_COOKIE_DOMAIN = process.env.WORKOS_COOKIE_DOMAIN;

// Clears the WorkOS session cookie and redirects home.
// Useful for users stuck in a 494 loop caused by an oversized session cookie.
// Navigate directly to /api/reset-session to escape without JS or RSC headers.
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));

  // The cookie is set with Domain=WORKOS_COOKIE_DOMAIN (e.g. ".ciaobang.com").
  // Deleting without that domain emits a host-only deletion that does not
  // clear the parent-domain cookie, leaving the user stuck.
  const expire = (name: string) => {
    response.cookies.set({
      name,
      value: "",
      path: "/",
      maxAge: 0,
      ...(SESSION_COOKIE_DOMAIN ? { domain: SESSION_COOKIE_DOMAIN } : {}),
    });
    response.cookies.set({ name, value: "", path: "/", maxAge: 0 });
  };

  expire(SESSION_COOKIE_NAME);
  for (let i = 0; i < 10; i++) {
    expire(`${SESSION_COOKIE_NAME}.${i}`);
  }

  return response;
}
