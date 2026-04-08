import { beforeEach, describe, expect, it, vi } from "vitest";

import { surveyQuestions } from "@/lib/survey/questions";
import type { SurveyDraft, SurveySubmission, SurveySubmissionSummary } from "@/lib/survey/types";

const getCurrentUserId = vi.fn();
const getSurveyRepository = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentUserId,
}));

vi.mock("@/lib/survey/repository", () => ({
  getSurveyRepository,
}));

const draftFixture: SurveyDraft = {
  submissionId: "draft-1",
  userId: "user_123",
  status: "draft",
  answerCount: 1,
  answers: {
    [surveyQuestions[0].id]: 4,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  submittedAt: null,
};

const submissionFixture: SurveySubmission = {
  ...draftFixture,
  status: "submitted",
  answerCount: surveyQuestions.length,
  answers: Object.fromEntries(surveyQuestions.map((question) => [question.id, 4] as const)),
  submittedAt: new Date().toISOString(),
};

const submissionSummaryFixture: SurveySubmissionSummary = {
  submissionId: submissionFixture.submissionId,
  userId: submissionFixture.userId,
  answerCount: submissionFixture.answerCount,
  createdAt: submissionFixture.createdAt,
  updatedAt: submissionFixture.updatedAt,
  submittedAt: submissionFixture.submittedAt,
};

describe("survey route handlers", () => {
  const repository = {
    ensureDraft: vi.fn(),
    getDraft: vi.fn(),
    upsertAnswer: vi.fn(),
    submitDraft: vi.fn(),
    getLatestSubmission: vi.fn(),
    getSubmissionById: vi.fn(),
    listSubmissions: vi.fn(),
  };

  beforeEach(() => {
    vi.resetModules();
    getCurrentUserId.mockReset();
    getSurveyRepository.mockReset();
    repository.ensureDraft.mockReset();
    repository.getDraft.mockReset();
    repository.upsertAnswer.mockReset();
    repository.submitDraft.mockReset();
    repository.getLatestSubmission.mockReset();
    repository.getSubmissionById.mockReset();
    repository.listSubmissions.mockReset();
    getSurveyRepository.mockReturnValue(repository);
  });

  it("returns 401 for unauthenticated draft requests", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const { GET } = await import("@/app/api/survey/draft/route");

    const response = await GET(new Request("http://localhost/api/survey/draft"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
  });

  it("saves answers against the signed-in user", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    repository.upsertAnswer.mockResolvedValue(draftFixture);
    const { PUT } = await import("@/app/api/survey/answer/route");

    const response = await PUT(
      new Request("http://localhost/api/survey/answer", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: surveyQuestions[0].id,
          questionOrder: surveyQuestions[0].order,
          value: 4,
        }),
      }),
    );

    expect(repository.upsertAnswer).toHaveBeenCalledWith({
      userId: "user_123",
      questionId: surveyQuestions[0].id,
      questionOrder: surveyQuestions[0].order,
      value: 4,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ draft: draftFixture });
  });

  it("submits a complete survey for the signed-in user", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    repository.submitDraft.mockResolvedValue(submissionFixture);
    const { POST } = await import("@/app/api/survey/submit/route");

    const response = await POST(
      new Request("http://localhost/api/survey/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: submissionFixture.answers,
        }),
      }),
    );

    expect(repository.submitDraft).toHaveBeenCalledWith({
      userId: "user_123",
      answers: submissionFixture.answers,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ submission: submissionFixture });
  });

  it("returns null results when no submitted survey exists", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    repository.getLatestSubmission.mockResolvedValue(null);
    const { GET } = await import("@/app/api/survey/results/latest/route");

    const response = await GET(new Request("http://localhost/api/survey/results/latest"));

    expect(repository.getLatestSubmission).toHaveBeenCalledWith("user_123");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ results: null });
  });

  it("returns composed dashboard results for the latest submitted survey", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    repository.getLatestSubmission.mockResolvedValue(submissionFixture);
    const { GET } = await import("@/app/api/survey/results/latest/route");

    const response = await GET(new Request("http://localhost/api/survey/results/latest"));
    const payload = (await response.json()) as {
      results: {
        frameworks: Array<unknown>;
        ranked: {
          highestByScore: Array<{ displayName: string; score: number }>;
        };
      };
    };

    expect(response.status).toBe(200);
    expect(payload.results.frameworks).toHaveLength(8);
    expect(payload.results.ranked.highestByScore[0].score).toBeGreaterThanOrEqual(
      payload.results.ranked.highestByScore[1].score,
    );
    expect(payload.results.ranked.highestByScore[0].displayName).toBeTruthy();
  });

  it("returns the saved survey history plus the selected submitted dashboard", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    repository.listSubmissions.mockResolvedValue([submissionSummaryFixture]);
    repository.getSubmissionById.mockResolvedValue(submissionFixture);
    const { GET } = await import("@/app/api/survey/results/route");

    const response = await GET(
      new Request(
        `http://localhost/api/survey/results?submissionId=${submissionFixture.submissionId}`,
      ),
    );
    const payload = (await response.json()) as {
      selectedSubmissionId: string | null;
      submissions: SurveySubmissionSummary[];
      results: {
        submission: {
          submissionId: string;
        };
      } | null;
    };

    expect(repository.listSubmissions).toHaveBeenCalledWith("user_123");
    expect(repository.getSubmissionById).toHaveBeenCalledWith(
      "user_123",
      submissionFixture.submissionId,
    );
    expect(response.status).toBe(200);
    expect(payload.selectedSubmissionId).toBe(submissionFixture.submissionId);
    expect(payload.submissions).toEqual([submissionSummaryFixture]);
    expect(payload.results?.submission.submissionId).toBe(submissionFixture.submissionId);
  });
});
