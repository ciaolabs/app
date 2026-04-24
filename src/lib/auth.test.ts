import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, getAuthMock, verifyTokenMock, redirectMock, clerkConfiguredMock, getClerkSecretKeyMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getAuthMock: vi.fn(),
  verifyTokenMock: vi.fn(),
  redirectMock: vi.fn(),
  clerkConfiguredMock: vi.fn(),
  getClerkSecretKeyMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  getAuth: getAuthMock,
  verifyToken: verifyTokenMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/clerk.server", () => ({
  isClerkConfigured: clerkConfiguredMock,
  getClerkSecretKey: getClerkSecretKeyMock,
}));

describe("auth helpers", () => {
  beforeEach(() => {
    authMock.mockReset();
    getAuthMock.mockReset();
    verifyTokenMock.mockReset();
    redirectMock.mockReset();
    clerkConfiguredMock.mockReset();
    getClerkSecretKeyMock.mockReset();
    clerkConfiguredMock.mockReturnValue(true);
    getClerkSecretKeyMock.mockReturnValue(null);
  });

  it("prefers the regular browser session before checking the session token", async () => {
    authMock
      .mockResolvedValueOnce({ userId: "user_cookie" })
      .mockResolvedValueOnce({ userId: "user_token" });

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(getCurrentUserId({ acceptsSessionToken: true })).resolves.toBe("user_cookie");
    expect(authMock).toHaveBeenCalledTimes(1);
    expect(authMock).toHaveBeenCalledWith({ treatPendingAsSignedOut: false });
  });

  it("falls back to the session token when the regular browser session is unavailable", async () => {
    authMock
      .mockResolvedValueOnce({ userId: null })
      .mockResolvedValueOnce({ userId: "user_token" });

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(getCurrentUserId({ acceptsSessionToken: true })).resolves.toBe("user_token");
    expect(authMock).toHaveBeenNthCalledWith(1, { treatPendingAsSignedOut: false });
    expect(authMock).toHaveBeenNthCalledWith(2, {
      acceptsToken: "session_token",
      treatPendingAsSignedOut: false,
    });
  });

  it("prefers request-bound browser auth in route handlers", async () => {
    getAuthMock
      .mockReturnValueOnce({ userId: "user_request_cookie" })
      .mockReturnValueOnce({ userId: "user_request_token" });

    const { getCurrentUserId } = await import("@/lib/auth");
    const request = new Request("http://localhost/api/surveys/personality/submit", { method: "POST" });

    await expect(
      getCurrentUserId({ acceptsSessionToken: true, request }),
    ).resolves.toBe("user_request_cookie");
    expect(getAuthMock).toHaveBeenCalledTimes(1);
    expect(getAuthMock).toHaveBeenCalledWith(request, {
      treatPendingAsSignedOut: false,
    });
  });

  it("falls back to request-bound session-token auth when needed", async () => {
    getAuthMock
      .mockReturnValueOnce({ userId: null })
      .mockReturnValueOnce({ userId: "user_request_token" });

    const { getCurrentUserId } = await import("@/lib/auth");
    const request = new Request("http://localhost/api/surveys/personality/submit", { method: "POST" });

    await expect(
      getCurrentUserId({ acceptsSessionToken: true, request }),
    ).resolves.toBe("user_request_token");
    expect(getAuthMock).toHaveBeenNthCalledWith(1, request, {
      treatPendingAsSignedOut: false,
    });
    expect(getAuthMock).toHaveBeenNthCalledWith(2, request, {
      acceptsToken: "session_token",
      treatPendingAsSignedOut: false,
    });
  });

  it("verifies the bearer token directly when Clerk request auth returns signed out", async () => {
    getAuthMock
      .mockReturnValueOnce({ userId: null })
      .mockReturnValueOnce({ userId: null });
    verifyTokenMock.mockResolvedValue({ sub: "user_verified" });
    getClerkSecretKeyMock.mockReturnValue("test_secret_key");

    const { getCurrentUserId } = await import("@/lib/auth");
    const request = new Request("http://localhost/api/surveys/personality/answer", {
      method: "PUT",
      headers: {
        Authorization: "Bearer test_session_token",
      },
    });

    await expect(
      getCurrentUserId({ acceptsSessionToken: true, request }),
    ).resolves.toBe("user_verified");
    expect(verifyTokenMock).toHaveBeenCalledWith("test_session_token", {
      secretKey: "test_secret_key",
      jwtKey: undefined,
    });
  });
});
