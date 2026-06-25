// @vitest-environment node
// Auth helpers are server-side; the node environment also avoids the jose/jsdom
// realm mismatch that breaks `Uint8Array instanceof` checks during signing.
import { SignJWT, generateKeyPair, type KeyLike } from "jose";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { withAuthMock, getWorkOSMock, createRemoteJWKSetMock, redirectMock } = vi.hoisted(
  () => ({
    withAuthMock: vi.fn(),
    getWorkOSMock: vi.fn(),
    createRemoteJWKSetMock: vi.fn(),
    redirectMock: vi.fn(),
  }),
);

vi.mock("@workos-inc/authkit-nextjs", () => ({
  withAuth: withAuthMock,
  getWorkOS: getWorkOSMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

// Mock ONLY the JWKS source. `jwtVerify` stays real, so these tests exercise
// genuine RS256 signature verification against a locally generated key pair.
vi.mock("jose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jose")>();
  return { ...actual, createRemoteJWKSet: createRemoteJWKSetMock };
});

type KeyPair = { publicKey: KeyLike; privateKey: KeyLike };

// The key WorkOS "owns" (its JWKS resolves to this public key) and an attacker
// key that WorkOS would never sign with.
let workos: KeyPair;
let attacker: KeyPair;

function bearerRequest(token: string) {
  return new Request("http://localhost/api/surveys/personality/answer", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function signWith(
  privateKey: KeyLike,
  claims: Record<string, unknown>,
  expSeconds = Math.floor(Date.now() / 1000) + 3600,
) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setExpirationTime(expSeconds)
    .sign(privateKey);
}

const b64url = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

describe("auth helpers", () => {
  beforeAll(async () => {
    workos = (await generateKeyPair("RS256")) as KeyPair;
    attacker = (await generateKeyPair("RS256")) as KeyPair;
  });

  beforeEach(() => {
    withAuthMock.mockReset();
    getWorkOSMock.mockReset();
    createRemoteJWKSetMock.mockReset();
    redirectMock.mockReset();

    process.env.WORKOS_API_KEY = "sk_test_workos";
    process.env.WORKOS_CLIENT_ID = "client_test";
    process.env.WORKOS_COOKIE_PASSWORD = "test_cookie_password_32_characters";

    // The SDK builds the JWKS URL from the client; we stub the resolver so it
    // returns WorkOS's public key (real key resolution would hit the network).
    getWorkOSMock.mockReturnValue({
      userManagement: {
        getJwksUrl: () => "https://api.workos.com/sso/jwks/client_test",
      },
    });
    createRemoteJWKSetMock.mockReturnValue(async () => workos.publicKey);
  });

  it("returns the signed-in user id from the WorkOS session cookie", async () => {
    withAuthMock.mockResolvedValue({ user: { id: "user_cookie" } });

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(getCurrentUserId({ acceptsSessionToken: true })).resolves.toBe("user_cookie");
    expect(withAuthMock).toHaveBeenCalledTimes(1);
    expect(createRemoteJWKSetMock).not.toHaveBeenCalled();
  });

  it("returns null when no session cookie and no Bearer token are present", async () => {
    withAuthMock.mockResolvedValue({ user: null });

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(getCurrentUserId({ acceptsSessionToken: true })).resolves.toBeNull();
  });

  it("returns null when the WorkOS session cannot be read", async () => {
    withAuthMock.mockRejectedValue(new Error("Unable to read session"));

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(getCurrentUserId({ acceptsSessionToken: true })).resolves.toBeNull();
  });

  it("accepts a Bearer token whose signature WorkOS produced", async () => {
    withAuthMock.mockResolvedValue({ user: null });
    const token = await signWith(workos.privateKey, { sub: "user_verified" });

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(
      getCurrentUserId({ acceptsSessionToken: true, request: bearerRequest(token) }),
    ).resolves.toBe("user_verified");
  });

  it("rejects a forged Bearer token signed with a non-WorkOS key", async () => {
    withAuthMock.mockResolvedValue({ user: null });
    // Attacker forges a token for a victim, signed with their own key.
    const forged = await signWith(attacker.privateKey, { sub: "user_victim" });

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(
      getCurrentUserId({ acceptsSessionToken: true, request: bearerRequest(forged) }),
    ).resolves.toBeNull();
  });

  it("rejects an unsigned (alg:none) Bearer token", async () => {
    withAuthMock.mockResolvedValue({ user: null });
    const algNone = `${b64url({ alg: "none", typ: "JWT" })}.${b64url({ sub: "user_victim" })}.`;

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(
      getCurrentUserId({ acceptsSessionToken: true, request: bearerRequest(algNone) }),
    ).resolves.toBeNull();
  });

  it("rejects an expired Bearer token even if correctly signed", async () => {
    withAuthMock.mockResolvedValue({ user: null });
    const expired = await signWith(
      workos.privateKey,
      { sub: "user_verified" },
      Math.floor(Date.now() / 1000) - 3600,
    );

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(
      getCurrentUserId({ acceptsSessionToken: true, request: bearerRequest(expired) }),
    ).resolves.toBeNull();
  });

  it("returns null when a verified token carries no sub claim", async () => {
    withAuthMock.mockResolvedValue({ user: null });
    const noSub = await signWith(workos.privateKey, { foo: "bar" });

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(
      getCurrentUserId({ acceptsSessionToken: true, request: bearerRequest(noSub) }),
    ).resolves.toBeNull();
  });

  it("ignores Bearer tokens when acceptsSessionToken is false", async () => {
    withAuthMock.mockResolvedValue({ user: null });
    const token = await signWith(workos.privateKey, { sub: "user_verified" });

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(getCurrentUserId({ request: bearerRequest(token) })).resolves.toBeNull();
    expect(createRemoteJWKSetMock).not.toHaveBeenCalled();
  });

  it("returns null when WorkOS env vars are missing", async () => {
    delete process.env.WORKOS_API_KEY;
    delete process.env.WORKOS_CLIENT_ID;
    delete process.env.WORKOS_COOKIE_PASSWORD;

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(getCurrentUserId()).resolves.toBeNull();
    expect(withAuthMock).not.toHaveBeenCalled();
  });

  it("returns null when the WorkOS cookie password is too short", async () => {
    process.env.WORKOS_COOKIE_PASSWORD = "too-short";

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(getCurrentUserId()).resolves.toBeNull();
    expect(withAuthMock).not.toHaveBeenCalled();
  });
});
