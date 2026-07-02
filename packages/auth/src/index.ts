import {
  getWorkOS,
  withAuth,
  type NoUserInfo,
  type UserInfo,
} from "@workos-inc/authkit-nextjs";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { redirect } from "next/navigation";

type GetCurrentUserIdOptions = {
  acceptsSessionToken?: boolean;
  request?: Request;
};

type InitialAuth = Omit<UserInfo | NoUserInfo, "accessToken">;

const NO_INITIAL_AUTH = {
  user: null,
} satisfies InitialAuth;

export const LOCAL_DEV_USER_ID = "local-dev-user";

const LOCAL_DEV_INITIAL_AUTH = {
  user: {
    object: "user",
    id: LOCAL_DEV_USER_ID,
    email: "local@dev.local",
    emailVerified: true,
    profilePictureUrl: null,
    firstName: "Local",
    lastName: "Dev",
    lastSignInAt: null,
    locale: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    externalId: null,
    metadata: {},
  },
  sessionId: "local-dev-session",
} as unknown as InitialAuth;

export function isLocalDevAuthBypass() {
  return process.env.NODE_ENV === "development";
}

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

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | undefined;

/**
 * Lazily build (and cache) the WorkOS JWKS used to verify access-token
 * signatures. Mirrors the AuthKit SDK's own internal verification source
 * (`createRemoteJWKSet(getWorkOS().userManagement.getJwksUrl(clientId))`).
 */
function getWorkOSJwks() {
  if (!cachedJwks) {
    const clientId = process.env.WORKOS_CLIENT_ID;
    if (!clientId) {
      throw new Error("WORKOS_CLIENT_ID is not configured");
    }
    const jwksUrl = getWorkOS().userManagement.getJwksUrl(clientId);
    cachedJwks = createRemoteJWKSet(new URL(jwksUrl));
  }
  return cachedJwks;
}

/**
 * Resolve the user id from a WorkOS access token supplied as a Bearer token.
 *
 * The token's RS256 signature is cryptographically verified against WorkOS's
 * JWKS, the algorithm is pinned, and expiry is enforced by `jwtVerify`. A token
 * that is unsigned, forged, expired, or signed by any key other than WorkOS's
 * is rejected (returns `null`). Note: `getTokenClaims`/`decodeJwt` must never be
 * used here — they only decode the payload and perform NO signature verification.
 */
async function verifyBearerToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getWorkOSJwks(), {
      // WorkOS signs AuthKit access tokens with RS256; pinning the algorithm is
      // defense-in-depth against algorithm-substitution attacks.
      algorithms: ["RS256"],
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getCurrentUserId({
  acceptsSessionToken = false,
  request,
}: GetCurrentUserIdOptions = {}) {
  if (isLocalDevAuthBypass()) {
    return LOCAL_DEV_USER_ID;
  }

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

type RequireCurrentUserIdOptions = {
  /** Path to come back to after sign-in. Must be an absolute path within the app. */
  returnPathname?: string;
};

function signInPath({ returnPathname }: RequireCurrentUserIdOptions) {
  if (returnPathname && returnPathname.startsWith("/") && !returnPathname.startsWith("//")) {
    return `/sign-in?next=${encodeURIComponent(returnPathname)}`;
  }
  return "/sign-in";
}

export async function requireCurrentUserId(options: RequireCurrentUserIdOptions = {}) {
  if (isLocalDevAuthBypass()) {
    return LOCAL_DEV_USER_ID;
  }

  if (!isWorkOSConfigured()) {
    redirect(signInPath(options));
  }

  let user: Awaited<ReturnType<typeof withAuth>>["user"];

  try {
    ({ user } = await withAuth());
  } catch {
    redirect(signInPath(options));
  }

  if (!user?.id) {
    redirect(signInPath(options));
  }

  return user.id;
}

export async function getInitialAuth(): Promise<InitialAuth> {
  if (isLocalDevAuthBypass()) {
    return LOCAL_DEV_INITIAL_AUTH;
  }

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

/**
 * Initial auth for layouts that must stay statically renderable. Unlike
 * `getInitialAuth` this never calls `withAuth()` (which reads cookies and
 * forces every route under the layout into per-request rendering). In the
 * local-dev bypass it returns the stub user; otherwise it returns undefined so
 * `AuthKitProvider` resolves the real session client-side after hydration.
 */
export function getStaticInitialAuth(): InitialAuth | undefined {
  if (isLocalDevAuthBypass()) {
    return LOCAL_DEV_INITIAL_AUTH;
  }

  return undefined;
}
