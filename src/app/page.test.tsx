import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUserIdMock } = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

describe("HomePage", () => {
  const originalPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const originalSecretKey = process.env.CLERK_SECRET_KEY;

  beforeEach(() => {
    (globalThis as { __clerkTestSignedIn?: boolean }).__clerkTestSignedIn = false;
    getCurrentUserIdMock.mockReset();
    getCurrentUserIdMock.mockResolvedValue(null);
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "test_publishable_key";
    process.env.CLERK_SECRET_KEY = "test_secret_key";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPublishableKey;
    process.env.CLERK_SECRET_KEY = originalSecretKey;
  });

  it("shows the embedded Clerk sign-in panel for signed-out visitors", async () => {
    const { default: HomePage } = await import("@/app/page");

    render(await HomePage());

    expect(screen.getByRole("button", { name: "Sign in to start" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start a survey →" })).toBeInTheDocument();
    expect(screen.queryByText("Account menu")).not.toBeInTheDocument();
  });

  it("shows direct survey links for signed-in users", async () => {
    (globalThis as { __clerkTestSignedIn?: boolean }).__clerkTestSignedIn = true;
    getCurrentUserIdMock.mockResolvedValue("user_123");
    const { default: HomePage } = await import("@/app/page");

    render(await HomePage());

    expect(screen.getByText("Account menu")).toBeInTheDocument();
    expect(screen.queryByTestId("clerk-sign-in")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Start a survey →" })).toHaveLength(3);
    for (const link of screen.getAllByRole("link", { name: "Start a survey →" })) {
      expect(link).toHaveAttribute("href", "/surveys");
    }
  });
});
