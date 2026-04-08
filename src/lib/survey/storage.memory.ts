import { QUESTION_COUNT } from "@/lib/survey/questions";
import {
  SurveyAnswers,
  SurveyDraft,
  SurveyRecord,
  SurveyRepository,
  SurveySubmission,
  SurveySubmissionSummary,
} from "@/lib/survey/types";

type MemorySurveyState = {
  drafts: Map<string, SurveyDraft>;
  submissions: Map<string, SurveySubmission[]>;
};

declare global {
  var __ambiMemorySurveyState: MemorySurveyState | undefined;
}

function getState() {
  if (!globalThis.__ambiMemorySurveyState) {
    globalThis.__ambiMemorySurveyState = {
      drafts: new Map(),
      submissions: new Map(),
    };
  }

  return globalThis.__ambiMemorySurveyState;
}

function cloneRecord<T extends SurveyRecord>(record: T): T {
  return {
    ...record,
    answers: { ...record.answers },
  };
}

function createDraft(userId: string): SurveyDraft {
  const now = new Date().toISOString();

  return {
    submissionId: crypto.randomUUID(),
    userId,
    status: "draft",
    answerCount: 0,
    answers: {},
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
  };
}

function countAnswers(answers: SurveyAnswers) {
  return Object.keys(answers).length;
}

function toSubmissionSummary(submission: SurveySubmission): SurveySubmissionSummary {
  return {
    submissionId: submission.submissionId,
    userId: submission.userId,
    answerCount: submission.answerCount,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    submittedAt: submission.submittedAt,
  };
}

export function createMemorySurveyRepository(): SurveyRepository {
  const state = getState();

  return {
    async ensureDraft(userId) {
      const existing = state.drafts.get(userId);

      if (existing) {
        return cloneRecord(existing);
      }

      const draft = createDraft(userId);
      state.drafts.set(userId, draft);
      return cloneRecord(draft);
    },

    async getDraft(userId) {
      const draft = state.drafts.get(userId);
      return draft ? cloneRecord(draft) : null;
    },

    async upsertAnswer({ userId, questionId, value }) {
      const draft = state.drafts.get(userId) ?? createDraft(userId);
      const nextAnswers = {
        ...draft.answers,
        [questionId]: value,
      };

      const nextDraft: SurveyDraft = {
        ...draft,
        answers: nextAnswers,
        answerCount: countAnswers(nextAnswers),
        updatedAt: new Date().toISOString(),
      };

      state.drafts.set(userId, nextDraft);
      return cloneRecord(nextDraft);
    },

    async submitDraft({ userId, answers }) {
      if (countAnswers(answers) !== QUESTION_COUNT) {
        throw new Error(`Expected ${QUESTION_COUNT} answers before submitting.`);
      }

      const draft = state.drafts.get(userId) ?? createDraft(userId);
      const submittedAt = new Date().toISOString();
      const submission: SurveySubmission = {
        ...draft,
        answers: { ...answers },
        answerCount: QUESTION_COUNT,
        status: "submitted",
        updatedAt: submittedAt,
        submittedAt,
      };

      state.drafts.delete(userId);
      const existingSubmissions = state.submissions.get(userId) ?? [];
      state.submissions.set(userId, [submission, ...existingSubmissions]);

      return cloneRecord(submission);
    },

    async getLatestSubmission(userId) {
      const submission = state.submissions.get(userId)?.[0] ?? null;
      return submission ? cloneRecord(submission) : null;
    },

    async getSubmissionById(userId, submissionId) {
      const submission =
        state.submissions
          .get(userId)
          ?.find((entry) => entry.submissionId === submissionId) ?? null;

      return submission ? cloneRecord(submission) : null;
    },

    async listSubmissions(userId) {
      return (state.submissions.get(userId) ?? []).map((submission) =>
        toSubmissionSummary(cloneRecord(submission)),
      );
    },
  };
}
