import React from "react";
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

  it("renders the surveys shell immediately while status data is pending", async () => {
    const statusesPromise = new Promise<Record<SurveyUserStatus["surveyType"], SurveyUserStatus>>(
      () => undefined,
    );
    getInitialSurveyStatusesMock.mockReturnValue(statusesPromise);
    const { default: SurveysPage } = await import("@/app/surveys/page");

    render(React.createElement(SurveysPage));

    expect(screen.getByText("Preparing your surveys")).toBeInTheDocument();
    expect(getInitialSurveyStatusesMock).toHaveBeenCalled();
  });

  it("renders the chooser after the streamed status data resolves", async () => {
    const initialStatuses = {
      personality: makeStatus("personality"),
      "values-beliefs": makeStatus("values-beliefs"),
    };
    const { ResolvedSurveyChooserContent } = await import("@/app/surveys/survey-page-content");

    render(React.createElement(ResolvedSurveyChooserContent, { initialStatuses }));

    expect(screen.getByText("Choose which survey you want to take next.")).toBeInTheDocument();
    expect(screen.queryByText("Preparing your survey")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading your survey status...")).not.toBeInTheDocument();
  });
});
