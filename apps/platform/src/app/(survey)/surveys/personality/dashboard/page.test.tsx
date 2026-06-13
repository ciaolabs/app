import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getInitialDashboardPayloadMock } = vi.hoisted(() => ({
  getInitialDashboardPayloadMock: vi.fn(),
}));

vi.mock("@/lib/survey/server", () => ({
  getInitialDashboardPayload: getInitialDashboardPayloadMock,
}));

vi.mock("@/components/dashboard/dashboard-shell", () => ({
  DashboardShell: ({
    initialPayload,
  }: {
    initialPayload: { selectedSubmissionId?: string | null };
  }) =>
    React.createElement(
      "div",
      { "data-testid": "dashboard-shell" },
      initialPayload.selectedSubmissionId ?? "none",
    ),
}));

describe("PersonalitySurveyDashboardPage", () => {
  beforeEach(() => {
    getInitialDashboardPayloadMock.mockReset();
  });

  it("redirects on the server when dashboard access is unavailable", async () => {
    getInitialDashboardPayloadMock.mockRejectedValue(new Error("redirected"));
    const { default: PersonalitySurveyDashboardPage } = await import(
      "@/app/(survey)/surveys/personality/dashboard/page"
    );

    await expect(PersonalitySurveyDashboardPage()).rejects.toThrow("redirected");
  });

  it("passes the initial dashboard payload directly into the dashboard shell", async () => {
    getInitialDashboardPayloadMock.mockResolvedValue({
      results: null,
      submissions: [],
      selectedSubmissionId: "submission_2",
    });
    const { default: PersonalitySurveyDashboardPage } = await import(
      "@/app/(survey)/surveys/personality/dashboard/page"
    );

    render(await PersonalitySurveyDashboardPage());

    expect(screen.getByTestId("dashboard-shell")).toHaveTextContent("submission_2");
    expect(screen.queryByText("Preparing your dashboard")).not.toBeInTheDocument();
  });
});
