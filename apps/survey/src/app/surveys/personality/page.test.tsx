import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequiredSurveyDraftMock } = vi.hoisted(() => ({
  getRequiredSurveyDraftMock: vi.fn(),
}));

vi.mock("@/lib/survey/server", () => ({
  getRequiredSurveyDraft: getRequiredSurveyDraftMock,
}));

vi.mock("@/components/survey/survey-shell", () => ({
  SurveyShell: ({
    initialDraft,
  }: {
    initialDraft: { submissionId: string };
  }) => React.createElement("div", { "data-testid": "survey-shell" }, initialDraft.submissionId),
}));

describe("PersonalitySurveyPage", () => {
  beforeEach(() => {
    getRequiredSurveyDraftMock.mockReset();
  });

  it("redirects on the server when the route cannot load a usable draft", async () => {
    getRequiredSurveyDraftMock.mockRejectedValue(new Error("redirected"));
    const { default: PersonalitySurveyPage } = await import("@/app/surveys/personality/page");

    await expect(PersonalitySurveyPage()).rejects.toThrow("redirected");
  });

  it("renders the survey shell immediately with the server draft", async () => {
    getRequiredSurveyDraftMock.mockResolvedValue({
      submissionId: "draft-1",
      userId: "user_123",
      surveyType: "personality",
      status: "draft",
      answerCount: 0,
      answers: {},
      createdAt: "2026-04-10T12:00:00.000Z",
      updatedAt: "2026-04-10T12:00:00.000Z",
      submittedAt: null,
    });
    const { default: PersonalitySurveyPage } = await import("@/app/surveys/personality/page");

    render(await PersonalitySurveyPage());

    expect(screen.getByTestId("survey-shell")).toHaveTextContent("draft-1");
    expect(screen.queryByText("Preparing your survey")).not.toBeInTheDocument();
  });
});
