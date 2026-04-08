import { auth, getAuth, verifyToken } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getClerkSecretKey, isClerkConfigured } from "@/lib/clerk.server";

type GetCurrentUserIdOptions = {
  acceptsSessionToken?: boolean;
  request?: Request;
};

type ClerkRequest = Parameters<typeof getAuth>[0];

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

function getSessionCookieToken(request: Request) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (rawName === "__session") {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

async function verifyRequestToken(request: Request) {
  const token = getBearerToken(request) ?? getSessionCookieToken(request);

  if (!token) {
    return null;
  }

  const secretKey = getClerkSecretKey();
  const jwtKey = process.env.CLERK_JWT_KEY;

  if (!secretKey && !jwtKey) {
    return null;
  }

  try {
    const verified = await verifyToken(token, {
      secretKey: secretKey ?? undefined,
      jwtKey,
    });

    return typeof verified?.sub === "string" ? verified.sub : null;
  } catch {
    return null;
  }
}

export async function getCurrentUserId({
  acceptsSessionToken = false,
  request,
}: GetCurrentUserIdOptions = {}) {
  if (!isClerkConfigured()) {
    return null;
  }

  if (request) {
    const standardSession = getAuth(request as ClerkRequest, {
      treatPendingAsSignedOut: false,
    });

    if (standardSession.userId) {
      return standardSession.userId;
    }

    if (!acceptsSessionToken) {
      return null;
    }

    const tokenSession = getAuth(request as ClerkRequest, {
      acceptsToken: "session_token",
      treatPendingAsSignedOut: false,
    });

    if (tokenSession.userId) {
      return tokenSession.userId;
    }

    return verifyRequestToken(request);
  }

  const standardSession = await auth({ treatPendingAsSignedOut: false });

  if (standardSession.userId) {
    return standardSession.userId;
  }

  if (!acceptsSessionToken) {
    return null;
  }

  const tokenSession = await auth({
    acceptsToken: "session_token",
    treatPendingAsSignedOut: false,
  });

  return tokenSession.userId;
}

export async function requireCurrentUserId() {
  if (!isClerkConfigured()) {
    redirect("/#auth-panel");
  }

  const { userId } = await auth({ treatPendingAsSignedOut: false });

  if (!userId) {
    redirect("/#auth-panel");
  }

  return userId;
}
