import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireCurrentUserIdMock, getRequiredSurveyDraftMock } = vi.hoisted(() => ({
  requireCurrentUserIdMock: vi.fn(),
  getRequiredSurveyDraftMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireCurrentUserId: requireCurrentUserIdMock,
}));

vi.mock("@/lib/survey/server", () => ({
  getRequiredSurveyDraft: getRequiredSurveyDraftMock,
}));

describe("ValuesBeliefsSurveyPage", () => {
  beforeEach(() => {
    requireCurrentUserIdMock.mockReset();
    requireCurrentUserIdMock.mockResolvedValue("user_123");
    getRequiredSurveyDraftMock.mockReset();
    getRequiredSurveyDraftMock.mockResolvedValue({
      submissionId: "draft-1",
      userId: "user_123",
      surveyType: "values-beliefs",
      status: "draft",
      answerCount: 0,
      answers: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: null,
    });
  });

  it("renders the live values and beliefs survey shell", async () => {
    const { default: ValuesBeliefsSurveyPage } = await import("@/app/(survey)/surveys/values-beliefs/page");

    render(await ValuesBeliefsSurveyPage());

    expect(screen.getByText("Survey progress")).toBeInTheDocument();
    expect(screen.getByText(/Part 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByText(/These statements ask about your beliefs/i)).toBeInTheDocument();
  });
});
