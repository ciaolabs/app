import { describe, expect, it } from "vitest";

import { QUESTION_COUNT, surveyQuestions } from "@/lib/survey/questions";
import { createMemorySurveyRepository } from "@/lib/survey/storage.memory";

describe("createMemorySurveyRepository", () => {
  it("creates drafts, upserts answers, and returns the saved submission history", async () => {
    const repository = createMemorySurveyRepository();
    const userId = `user_${crypto.randomUUID()}`;
    const initialDraft = await repository.ensureDraft(userId);

    expect(initialDraft.status).toBe("draft");
    expect(initialDraft.answerCount).toBe(0);

    const updatedDraft = await repository.upsertAnswer({
      userId,
      questionId: surveyQuestions[0].id,
      questionOrder: surveyQuestions[0].order,
      value: 4,
    });

    expect(updatedDraft.answerCount).toBe(1);
    expect(updatedDraft.answers[surveyQuestions[0].id]).toBe(4);

    const answers = Object.fromEntries(
      surveyQuestions.map((question) => [question.id, 4] as const),
    );
    const submission = await repository.submitDraft({
      userId,
      answers,
    });

    expect(submission.status).toBe("submitted");
    expect(submission.answerCount).toBe(QUESTION_COUNT);

    const latestSubmission = await repository.getLatestSubmission(userId);

    expect(latestSubmission?.submissionId).toBe(submission.submissionId);
    expect(latestSubmission?.answers[surveyQuestions[10].id]).toBe(4);

    const listedSubmissions = await repository.listSubmissions(userId);
    const selectedSubmission = await repository.getSubmissionById(userId, submission.submissionId);

    expect(listedSubmissions).toHaveLength(1);
    expect(listedSubmissions[0]?.submissionId).toBe(submission.submissionId);
    expect(selectedSubmission?.submittedAt).toBe(submission.submittedAt);
  });
});
