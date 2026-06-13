import { describe, expect, it } from "vitest";

import { personalitySurveyDefinition } from "@/lib/survey/definitions";
import { QUESTION_COUNT } from "@/lib/survey/constants";
import { surveyQuestions } from "@/lib/survey/questions";
import { createMemorySurveyRepository } from "@/lib/survey/storage.memory";

describe("createMemorySurveyRepository", () => {
  it("scopes drafts and submission history by survey type", async () => {
    const repository = createMemorySurveyRepository();
    const userId = `user_${crypto.randomUUID()}`;
    const initialDraft = await repository.ensureDraft(userId, "personality");
    const valuesDraft = await repository.ensureDraft(userId, "values-beliefs");

    expect(initialDraft.status).toBe("draft");
    expect(initialDraft.surveyType).toBe("personality");
    expect(initialDraft.answerCount).toBe(0);
    expect(valuesDraft.surveyType).toBe("values-beliefs");

    const updatedDraft = await repository.upsertAnswer({
      userId,
      surveyType: "personality",
      questionId: surveyQuestions[0].id,
      questionOrder: surveyQuestions[0].order,
      value: 4,
    });

    expect(updatedDraft.answerCount).toBe(1);
    expect(updatedDraft.answers[surveyQuestions[0].id]).toBe(4);

    const answers = Object.fromEntries(
      surveyQuestions.map((question) => [question.id, 4] as const),
    );
    const firstSubmission = await repository.submitDraft({
      userId,
      surveyType: "personality",
      answers,
    });
    const secondDraft = await repository.ensureDraft(userId, "personality");
    const secondSubmission = await repository.submitDraft({
      userId,
      surveyType: "personality",
      answers,
    });

    expect(firstSubmission.status).toBe("submitted");
    expect(firstSubmission.answerCount).toBe(QUESTION_COUNT);
    expect(secondDraft.surveyType).toBe("personality");
    expect(secondSubmission.surveyType).toBe("personality");

    const latestSubmission = await repository.getLatestSubmission(userId, "personality");

    expect(latestSubmission?.submissionId).toBe(secondSubmission.submissionId);
    expect(latestSubmission?.answers[surveyQuestions[10].id]).toBe(4);

    const listedSubmissions = await repository.listSubmissions(userId, "personality");
    const selectedSubmission = await repository.getSubmissionById(
      userId,
      "personality",
      firstSubmission.submissionId,
    );
    const personalityStatus = await repository.getSurveyStatus(userId, "personality");
    const valuesStatus = await repository.getSurveyStatus(userId, "values-beliefs");

    expect(listedSubmissions).toHaveLength(2);
    expect(listedSubmissions[0]?.submissionId).toBe(secondSubmission.submissionId);
    expect(selectedSubmission?.submittedAt).toBe(firstSubmission.submittedAt);
    expect(personalityStatus).toEqual({
      surveyType: personalitySurveyDefinition.type,
      submittedCount: 2,
      hasActiveDraft: false,
      activeDraftAnswerCount: 0,
      latestSubmissionAt: secondSubmission.submittedAt,
      latestSubmissionId: secondSubmission.submissionId,
    });
    expect(valuesStatus).toEqual({
      surveyType: "values-beliefs",
      submittedCount: 0,
      hasActiveDraft: true,
      activeDraftAnswerCount: valuesDraft.answerCount,
      latestSubmissionAt: null,
      latestSubmissionId: null,
    });
  });
});
