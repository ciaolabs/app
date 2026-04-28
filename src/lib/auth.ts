import { getTokenClaims, withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

type GetCurrentUserIdOptions = {
  acceptsSessionToken?: boolean;
  request?: Request;
};

export function isWorkOSConfigured() {
  return Boolean(process.env.WORKOS_API_KEY && process.env.WORKOS_CLIENT_ID);
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

async function verifyBearerToken(token: string) {
  try {
    const claims = await getTokenClaims(token);
    return typeof claims?.sub === "string" ? claims.sub : null;
  } catch {
    return null;
  }
}

export async function getCurrentUserId({
  acceptsSessionToken = false,
  request,
}: GetCurrentUserIdOptions = {}) {
  if (!isWorkOSConfigured()) {
    return null;
  }

  const { user } = await withAuth();

  if (user?.id) {
    return user.id;
  }

  if (acceptsSessionToken && request) {
    const token = getBearerToken(request);

    if (token) {
      return verifyBearerToken(token);
    }
  }

  return null;
}

export async function requireCurrentUserId() {
  if (!isWorkOSConfigured()) {
    redirect("/");
  }

  const { user } = await withAuth({ ensureSignedIn: true });
  return user.id;
}
