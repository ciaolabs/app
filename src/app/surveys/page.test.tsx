import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SurveyUserStatus } from "@/lib/survey/types";

const { getInitialSurveyStatusesMock } = vi.hoisted(() => ({
  getInitialSurveyStatusesMock: vi.fn(),
}));

vi.mock("@/lib/survey/server", () => ({
  getInitialSurveyStatuses: getInitialSurveyStatusesMock,
}));

function makeStatus(
  surveyType: SurveyUserStatus["surveyType"],
  overrides?: Partial<SurveyUserStatus>,
): SurveyUserStatus {
  return {
    surveyType,
    submittedCount: 0,
    hasActiveDraft: false,
    latestSubmissionAt: null,
    latestSubmissionId: null,
    ...overrides,
  };
}

describe("SurveysPage", () => {
  beforeEach(() => {
    getInitialSurveyStatusesMock.mockReset();
  });

  it("redirects at the server boundary when survey access is unavailable", async () => {
    getInitialSurveyStatusesMock.mockRejectedValue(new Error("redirected"));
    const { default: SurveysPage } = await import("@/app/surveys/page");

    await expect(SurveysPage()).rejects.toThrow("redirected");
  });

  it("renders the chooser directly without the old protected-route loading panel", async () => {
    getInitialSurveyStatusesMock.mockResolvedValue({
      personality: makeStatus("personality"),
      "values-beliefs": makeStatus("values-beliefs"),
    });
    const { default: SurveysPage } = await import("@/app/surveys/page");

    render(await SurveysPage());

    expect(screen.getByText("Choose which survey you want to take next.")).toBeInTheDocument();
    expect(screen.queryByText("Preparing your survey")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading your survey status...")).not.toBeInTheDocument();
  });
});
