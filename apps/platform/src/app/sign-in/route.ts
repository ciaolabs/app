import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";

import { isWorkOSConfigured } from "@/lib/auth";

function missingAuthConfigResponse(origin: string) {
  const redirectUri = `${origin}/callback`;

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sign-in is not configured</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #faf9f7;
        color: #000;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(90vw, 42rem);
        border: 1px solid #dad4c8;
        border-radius: 1.5rem;
        background: #fff;
        padding: 2rem;
        box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
      }
      h1 {
        margin: 0;
        font-size: clamp(2rem, 5vw, 3rem);
        line-height: 1;
      }
      p, li {
        color: #55534e;
        line-height: 1.7;
      }
      code {
        color: #000;
        background: #eee9df;
        border-radius: 0.45rem;
        padding: 0.1rem 0.35rem;
      }
      a {
        color: #000;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Sign-in is not configured locally.</h1>
      <p>Add these values to <code>.env.local</code>, then restart the dev server:</p>
      <ul>
        <li><code>WORKOS_CLIENT_ID</code></li>
        <li><code>WORKOS_API_KEY</code></li>
        <li><code>WORKOS_COOKIE_PASSWORD</code> with at least 32 characters</li>
        <li><code>NEXT_PUBLIC_WORKOS_REDIRECT_URI=${redirectUri}</code></li>
      </ul>
      <p>You can generate a cookie password with <code>openssl rand -base64 32</code>.</p>
      <p><a href="/">Return home</a></p>
    </main>
  </body>
</html>`,
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );
}

function sanitizeReturnPathname(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return undefined;
  }
  return value;
}

export const GET = async (request: NextRequest) => {
  if (!isWorkOSConfigured()) {
    return missingAuthConfigResponse(request.nextUrl.origin);
  }

  const redirectUri =
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ?? `${request.nextUrl.origin}/callback`;
  // authkit-nextjs v4 renamed this option to `returnTo` (it Omit-s
  // `returnPathname`, so passing the old name is silently dropped).
  const returnTo = sanitizeReturnPathname(request.nextUrl.searchParams.get("next"));
  const url = await getSignInUrl({ redirectUri, ...(returnTo ? { returnTo } : {}) });

  redirect(url);
};
