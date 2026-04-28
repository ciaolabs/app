import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUserIdMock } = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

describe("HomePage", () => {
  const originalApiKey = process.env.WORKOS_API_KEY;
  const originalClientId = process.env.WORKOS_CLIENT_ID;

  beforeEach(() => {
    (globalThis as { __authTestSignedIn?: boolean }).__authTestSignedIn = false;
    getCurrentUserIdMock.mockReset();
    getCurrentUserIdMock.mockResolvedValue(null);
    process.env.WORKOS_API_KEY = "sk_test_workos";
    process.env.WORKOS_CLIENT_ID = "client_test";
  });

  afterEach(() => {
    process.env.WORKOS_API_KEY = originalApiKey;
    process.env.WORKOS_CLIENT_ID = originalClientId;
  });

  it("shows WorkOS sign-in links for signed-out visitors", async () => {
    const { default: HomePage } = await import("@/app/page");

    render(await HomePage());

    expect(screen.getByRole("link", { name: "Sign in to start" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    const startLinks = screen.getAllByRole("link", { name: "Start a survey →" });
    expect(startLinks).toHaveLength(2);
    for (const link of startLinks) {
      expect(link).toHaveAttribute("href", "/sign-in");
    }
    expect(screen.queryByRole("button", { name: "Account menu" })).not.toBeInTheDocument();
  });

  it("shows direct survey links for signed-in users", async () => {
    (globalThis as { __authTestSignedIn?: boolean }).__authTestSignedIn = true;
    getCurrentUserIdMock.mockResolvedValue("user_123");
    const { default: HomePage } = await import("@/app/page");

    render(await HomePage());

    expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Start a survey →" })).toHaveLength(3);
    for (const link of screen.getAllByRole("link", { name: "Start a survey →" })) {
      expect(link).toHaveAttribute("href", "/surveys");
    }
  });
});
