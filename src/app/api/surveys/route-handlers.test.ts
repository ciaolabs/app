import { beforeEach, describe, expect, it, vi } from "vitest";

import { personalitySurveyDefinition } from "@/lib/survey/definitions";
import { getSurveyQuestions, surveyQuestions } from "@/lib/survey/questions";
import type { SurveyDraft, SurveySubmission, SurveySubmissionSummary, SurveyUserStatus } from "@/lib/survey/types";

const getCurrentUserId = vi.fn();
const getSurveyRepository = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentUserId,
}));

vi.mock("@/lib/survey/repository", () => ({
  getSurveyRepository,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const draftFixture: SurveyDraft = {
  submissionId: "draft-1",
  userId: "user_123",
  surveyType: personalitySurveyDefinition.type,
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
  surveyType: submissionFixture.surveyType,
  answerCount: submissionFixture.answerCount,
  createdAt: submissionFixture.createdAt,
  updatedAt: submissionFixture.updatedAt,
  submittedAt: submissionFixture.submittedAt,
};

const statusFixture: SurveyUserStatus = {
  surveyType: personalitySurveyDefinition.type,
  submittedCount: 1,
  hasActiveDraft: false,
  latestSubmissionAt: submissionFixture.submittedAt,
  latestSubmissionId: submissionFixture.submissionId,
};

const routeContext = {
  params: Promise.resolve({ surveyType: personalitySurveyDefinition.type }),
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
    getSurveyStatus: vi.fn(),
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
    repository.getSurveyStatus.mockReset();
    getSurveyRepository.mockReturnValue(repository);
  });

  it("returns 401 for unauthenticated draft requests", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const { GET } = await import("@/app/api/surveys/[surveyType]/draft/route");

    const response = await GET(
      new Request("http://localhost/api/surveys/personality/draft"),
      routeContext,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
  });

  it("returns chooser status for the selected survey", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    repository.getSurveyStatus.mockResolvedValue(statusFixture);
    const { GET } = await import("@/app/api/surveys/[surveyType]/status/route");

    const response = await GET(
      new Request("http://localhost/api/surveys/personality/status"),
      routeContext,
    );

    expect(repository.getSurveyStatus).toHaveBeenCalledWith("user_123", "personality");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: statusFixture });
  });

  it("saves answers against the signed-in user and survey type", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    repository.getSurveyStatus.mockResolvedValue({
      ...statusFixture,
      submittedCount: 0,
    });
    repository.upsertAnswer.mockResolvedValue(draftFixture);
    const { PUT } = await import("@/app/api/surveys/[surveyType]/answer/route");

    const response = await PUT(
      new Request("http://localhost/api/surveys/personality/answer", {
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
      routeContext,
    );

    expect(repository.upsertAnswer).toHaveBeenCalledWith({
      userId: "user_123",
      surveyType: "personality",
      questionId: surveyQuestions[0].id,
      questionOrder: surveyQuestions[0].order,
      value: 4,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ draft: draftFixture });
  });

  it("accepts same-origin answer saves without an authorization header", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    repository.getSurveyStatus.mockResolvedValue({
      ...statusFixture,
      submittedCount: 0,
    });
    repository.upsertAnswer.mockResolvedValue(draftFixture);
    const { PUT } = await import("@/app/api/surveys/[surveyType]/answer/route");
    const request = new Request("http://localhost/api/surveys/personality/answer", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: "__session=session_cookie",
      },
      body: JSON.stringify({
        questionId: surveyQuestions[0].id,
        questionOrder: surveyQuestions[0].order,
        value: 5,
      }),
    });

    const response = await PUT(request, routeContext);

    expect(request.headers.has("Authorization")).toBe(false);
    expect(getCurrentUserId).toHaveBeenCalledWith({ acceptsSessionToken: true, request });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ draft: draftFixture });
  });

  it("submits a complete survey for the signed-in user", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    repository.getSurveyStatus.mockResolvedValue({
      ...statusFixture,
      submittedCount: 1,
    });
    repository.submitDraft.mockResolvedValue(submissionFixture);
    const { POST } = await import("@/app/api/surveys/[surveyType]/submit/route");

    const response = await POST(
      new Request("http://localhost/api/surveys/personality/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: submissionFixture.answers,
        }),
      }),
      routeContext,
    );

    expect(repository.submitDraft).toHaveBeenCalledWith({
      userId: "user_123",
      surveyType: "personality",
      answers: submissionFixture.answers,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ submission: submissionFixture });
  });

  it("rejects a third submission once the final attempt has already been used", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    repository.getSurveyStatus.mockResolvedValue({
      ...statusFixture,
      submittedCount: 2,
    });
    const { POST } = await import("@/app/api/surveys/[surveyType]/submit/route");

    const response = await POST(
      new Request("http://localhost/api/surveys/personality/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: submissionFixture.answers,
        }),
      }),
      routeContext,
    );

    expect(repository.submitDraft).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "You have already used your final attempt for this survey.",
    });
  });

  it("returns the saved survey history plus the selected submitted dashboard", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    repository.listSubmissions.mockResolvedValue([submissionSummaryFixture]);
    repository.getSubmissionById.mockResolvedValue(submissionFixture);
    const { GET } = await import("@/app/api/surveys/[surveyType]/results/route");

    const response = await GET(
      new Request(
        `http://localhost/api/surveys/personality/results?submissionId=${submissionFixture.submissionId}`,
      ),
      routeContext,
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

    expect(repository.listSubmissions).toHaveBeenCalledWith("user_123", "personality");
    expect(repository.getSubmissionById).toHaveBeenCalledWith(
      "user_123",
      "personality",
      submissionFixture.submissionId,
    );
    expect(response.status).toBe(200);
    expect(payload.selectedSubmissionId).toBe(submissionFixture.submissionId);
    expect(payload.submissions).toEqual([submissionSummaryFixture]);
    expect(payload.results?.submission.submissionId).toBe(submissionFixture.submissionId);
  }, 10000);

  it("builds the values-beliefs results payload for the selected survey type", async () => {
    const valuesQuestions = getSurveyQuestions("values-beliefs");
    const valuesSubmission: SurveySubmission = {
      ...submissionFixture,
      submissionId: "values_submission_1",
      surveyType: "values-beliefs",
      answerCount: valuesQuestions.length,
      answers: Object.fromEntries(valuesQuestions.map((question) => [question.id, 4] as const)),
    };
    const valuesSummary: SurveySubmissionSummary = {
      submissionId: valuesSubmission.submissionId,
      userId: valuesSubmission.userId,
      surveyType: valuesSubmission.surveyType,
      answerCount: valuesSubmission.answerCount,
      createdAt: valuesSubmission.createdAt,
      updatedAt: valuesSubmission.updatedAt,
      submittedAt: valuesSubmission.submittedAt,
    };

    getCurrentUserId.mockResolvedValue("user_123");
    repository.listSubmissions.mockResolvedValue([valuesSummary]);
    repository.getLatestSubmission.mockResolvedValue(valuesSubmission);
    const { GET } = await import("@/app/api/surveys/[surveyType]/results/route");

    const response = await GET(
      new Request("http://localhost/api/surveys/values-beliefs/results"),
      {
        params: Promise.resolve({ surveyType: "values-beliefs" }),
      },
    );
    const payload = (await response.json()) as {
      results: { surveyType: string; beliefs?: object; values?: object } | null;
      selectedSubmissionId: string | null;
    };

    expect(repository.listSubmissions).toHaveBeenCalledWith("user_123", "values-beliefs");
    expect(repository.getLatestSubmission).toHaveBeenCalledWith("user_123", "values-beliefs");
    expect(repository.getSubmissionById).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(payload.selectedSubmissionId).toBe(valuesSubmission.submissionId);
    expect(payload.results?.surveyType).toBe("values-beliefs");
    expect(payload.results?.beliefs).toBeDefined();
    expect(payload.results?.values).toBeDefined();
  });
});
