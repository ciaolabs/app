import {
  getTokenClaims,
  withAuth,
  type NoUserInfo,
  type UserInfo,
} from "@workos-inc/authkit-nextjs";
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
