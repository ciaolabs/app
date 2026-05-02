import { beforeEach, describe, expect, it, vi } from "vitest";

const { withAuthMock, getTokenClaimsMock, redirectMock } = vi.hoisted(() => ({
  withAuthMock: vi.fn(),
  getTokenClaimsMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({
  withAuth: withAuthMock,
  getTokenClaims: getTokenClaimsMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("auth helpers", () => {
  beforeEach(() => {
    withAuthMock.mockReset();
    getTokenClaimsMock.mockReset();
    redirectMock.mockReset();
    process.env.WORKOS_API_KEY = "sk_test_workos";
    process.env.WORKOS_CLIENT_ID = "client_test";
    process.env.WORKOS_COOKIE_PASSWORD = "test_cookie_password_32_characters";
  });

  it("returns the signed-in user id from the WorkOS session cookie", async () => {
    withAuthMock.mockResolvedValue({ user: { id: "user_cookie" } });

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(getCurrentUserId({ acceptsSessionToken: true })).resolves.toBe("user_cookie");
    expect(withAuthMock).toHaveBeenCalledTimes(1);
    expect(getTokenClaimsMock).not.toHaveBeenCalled();
  });

  it("returns null when no session cookie and no Bearer token are present", async () => {
    withAuthMock.mockResolvedValue({ user: null });

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(getCurrentUserId({ acceptsSessionToken: true })).resolves.toBeNull();
    expect(getTokenClaimsMock).not.toHaveBeenCalled();
  });

  it("returns null when the WorkOS session cannot be read", async () => {
    withAuthMock.mockRejectedValue(new Error("Unable to read session"));

    const { getCurrentUserId } = await import("@/lib/auth");

    await expect(getCurrentUserId({ acceptsSessionToken: true })).resolves.toBeNull();
    expect(getTokenClaimsMock).not.toHaveBeenCalled();
  });

  it("falls back to verifying a Bearer token when the session is missing", async () => {
    withAuthMock.mockResolvedValue({ user: null });
    getTokenClaimsMock.mockResolvedValue({ sub: "user_verified" });

    const { getCurrentUserId } = await import("@/lib/auth");
    const request = new Request("http://localhost/api/surveys/personality/answer", {
      method: "PUT",
      headers: { Authorization: "Bearer test_session_token" },
    });

    await expect(
      getCurrentUserId({ acceptsSessionToken: true, request }),
    ).resolves.toBe("user_verified");
    expect(getTokenClaimsMock).toHaveBeenCalledWith("test_session_token");
  });

  it("ignores Bearer tokens when acceptsSessionToken is false", async () => {
    withAuthMock.mockResolvedValue({ user: null });

    const { getCurrentUserId } = await import("@/lib/auth");
    const request = new Request("http://localhost/api/surveys/personality/answer", {
      method: "PUT",
      headers: { Authorization: "Bearer test_session_token" },
    });

    await expect(getCurrentUserId({ request })).resolves.toBeNull();
    expect(getTokenClaimsMock).not.toHaveBeenCalled();
  });

  it("returns null when the Bearer token cannot be verified", async () => {
    withAuthMock.mockResolvedValue({ user: null });
    getTokenClaimsMock.mockRejectedValue(new Error("invalid token"));

    const { getCurrentUserId } = await import("@/lib/auth");
    const request = new Request("http://localhost/api/surveys/personality/answer", {
      method: "PUT",
      headers: { Authorization: "Bearer bad_token" },
    });

    await expect(
      getCurrentUserId({ acceptsSessionToken: true, request }),
    ).resolves.toBeNull();
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
