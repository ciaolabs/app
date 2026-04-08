import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SiteTopNav } from "@/components/site-top-nav";
import { SURVEY_RESULTS_ROUTE } from "@/lib/survey/routes";

describe("SiteTopNav", () => {
  afterEach(() => {
    (globalThis as { __clerkTestSignedIn?: boolean }).__clerkTestSignedIn = false;
  });

  it("adds a dashboard link inside the signed-in account menu", () => {
    (globalThis as { __clerkTestSignedIn?: boolean }).__clerkTestSignedIn = true;

    render(
      React.createElement(SiteTopNav, {
        action: React.createElement("button", { type: "button" }, "Primary action"),
      }),
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      SURVEY_RESULTS_ROUTE,
    );
  });
});
