import { getTokenClaims, withAuth, type NoUserInfo, type UserInfo } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

type GetCurrentUserIdOptions = {
  acceptsSessionToken?: boolean;
  request?: Request;
};

type InitialAuth = Omit<UserInfo | NoUserInfo, "accessToken">;

const NO_INITIAL_AUTH = {
  user: null,
} satisfies InitialAuth;

export function isWorkOSConfigured() {
  return Boolean(
    process.env.WORKOS_API_KEY &&
      process.env.WORKOS_CLIENT_ID &&
      process.env.WORKOS_COOKIE_PASSWORD &&
      process.env.WORKOS_COOKIE_PASSWORD.length >= 32,
  );
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

  let user: Awaited<ReturnType<typeof withAuth>>["user"];

  try {
    ({ user } = await withAuth());
  } catch {
    return null;
  }

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

export async function getInitialAuth(): Promise<InitialAuth> {
  if (!isWorkOSConfigured()) {
    return NO_INITIAL_AUTH;
  }

  try {
    const auth = await withAuth();
    return Object.fromEntries(
      Object.entries(auth).filter(([key]) => key !== "accessToken"),
    ) as InitialAuth;
  } catch {
    return NO_INITIAL_AUTH;
  }
}
