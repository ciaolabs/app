import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import HomePage from "@/app/(survey)/page";

// The landing page is statically rendered: signed-in state resolves
// client-side through AuthKit's useAuth, which vitest.setup.ts mocks via the
// global __authTestSignedIn flag.
describe("HomePage", () => {
  beforeEach(() => {
    (globalThis as { __authTestSignedIn?: boolean }).__authTestSignedIn = false;
  });

  it("shows WorkOS sign-in links for signed-out visitors", () => {
    render(<HomePage />);

    const signInLinks = screen.getAllByRole("link", { name: "Sign in to start →" });
    expect(signInLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of signInLinks) {
      expect(link).toHaveAttribute("href", "/sign-in");
    }
    expect(screen.queryByRole("button", { name: "Account menu" })).not.toBeInTheDocument();
  });

  it("shows direct survey links for signed-in users", () => {
    (globalThis as { __authTestSignedIn?: boolean }).__authTestSignedIn = true;

    render(<HomePage />);

    expect(screen.queryByRole("link", { name: "Sign in to start →" })).not.toBeInTheDocument();
    const startButtons = screen.getAllByRole("button", { name: "Start a survey →" });
    expect(startButtons.length).toBeGreaterThanOrEqual(2);

    fireEvent.mouseDown(startButtons[0]);

    const openingButton = screen.getByRole("button", { name: "Opening..." });
    expect(openingButton).toBeDisabled();
    expect(openingButton.querySelectorAll(".opening-dots span")).toHaveLength(3);
  });
});
