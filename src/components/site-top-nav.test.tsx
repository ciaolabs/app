import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteTopNav } from "@/components/site-top-nav";
import { SURVEYS_ROUTE } from "@/lib/survey/routes";

describe("SiteTopNav", () => {
  afterEach(() => {
    (globalThis as { __authTestSignedIn?: boolean }).__authTestSignedIn = false;
    (globalThis as { __authTestSignOut?: ReturnType<typeof vi.fn> }).__authTestSignOut?.mockReset();
  });

  it("adds a dashboard link inside the signed-in account menu", async () => {
    (globalThis as { __authTestSignedIn?: boolean }).__authTestSignedIn = true;
    const user = userEvent.setup();

    render(
      React.createElement(SiteTopNav, {
        action: React.createElement("button", { type: "button" }, "Primary action"),
      }),
    );

    await user.click(screen.getByRole("button", { name: "Account menu" }));

    expect(screen.getByRole("menuitem", { name: /Dashboard/i })).toHaveAttribute(
      "href",
      SURVEYS_ROUTE,
    );
  });

  it("signs out to the current site origin instead of a relative WorkOS return URL", async () => {
    (globalThis as { __authTestSignedIn?: boolean }).__authTestSignedIn = true;
    const signOutMock = (globalThis as { __authTestSignOut?: ReturnType<typeof vi.fn> })
      .__authTestSignOut;
    const user = userEvent.setup();

    render(
      React.createElement(SiteTopNav, {
        action: React.createElement("button", { type: "button" }, "Primary action"),
      }),
    );

    await user.click(screen.getByRole("button", { name: "Account menu" }));
    await user.click(screen.getByRole("menuitem", { name: /Sign out/i }));

    expect(signOutMock).toHaveBeenCalledWith({ returnTo: window.location.origin });
  });
});
