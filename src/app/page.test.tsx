import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("HomePage", () => {
  const originalPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const originalSecretKey = process.env.CLERK_SECRET_KEY;

  beforeEach(() => {
    (globalThis as { __clerkTestSignedIn?: boolean }).__clerkTestSignedIn = false;
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
    process.env.CLERK_SECRET_KEY = "sk_test_123";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPublishableKey;
    process.env.CLERK_SECRET_KEY = originalSecretKey;
  });

  it("shows the embedded Clerk sign-in panel for signed-out visitors", async () => {
    const { default: HomePage } = await import("@/app/page");

    render(<HomePage />);

    expect(screen.getByRole("button", { name: "Sign in to start" })).toBeInTheDocument();
    expect(screen.getByTestId("clerk-sign-in")).toBeInTheDocument();
    expect(screen.queryByText("Account menu")).not.toBeInTheDocument();
  });

  it("shows the account menu and survey CTA for signed-in users", async () => {
    (globalThis as { __clerkTestSignedIn?: boolean }).__clerkTestSignedIn = true;
    const { default: HomePage } = await import("@/app/page");

    render(<HomePage />);

    expect(screen.getByText("Account menu")).toBeInTheDocument();
    expect(screen.queryByTestId("clerk-sign-in")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start survey" })).toBeInTheDocument();
  });
});
