import { getActiveSurveyDefinition } from "@/lib/survey/definitions";
import {
  SurveyAnswers,
  SurveyDraft,
  SurveyRecord,
  SurveyRepository,
  SurveySubmission,
  SurveySubmissionSummary,
  SurveyType,
  SurveyUserStatus,
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

function getStateKey(userId: string, surveyType: SurveyType) {
  return `${userId}:${surveyType}`;
}

function createDraft(userId: string, surveyType: SurveyType): SurveyDraft {
  const now = new Date().toISOString();

  return {
    submissionId: crypto.randomUUID(),
    userId,
    surveyType,
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
    surveyType: submission.surveyType,
    answerCount: submission.answerCount,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    submittedAt: submission.submittedAt,
  };
}

export function createMemorySurveyRepository(): SurveyRepository {
  const state = getState();

  return {
    async ensureDraft(userId, surveyType) {
      const stateKey = getStateKey(userId, surveyType);
      const existing = state.drafts.get(stateKey);

      if (existing) {
        return cloneRecord(existing);
      }

      const draft = createDraft(userId, surveyType);
      state.drafts.set(stateKey, draft);
      return cloneRecord(draft);
    },

    async getDraft(userId, surveyType) {
      const draft = state.drafts.get(getStateKey(userId, surveyType));
      return draft ? cloneRecord(draft) : null;
    },

    async upsertAnswer({ userId, surveyType, submissionId, questionId, value }) {
      const stateKey = getStateKey(userId, surveyType);
      const existingDraft = state.drafts.get(stateKey);

      if (submissionId && existingDraft?.submissionId !== submissionId) {
        throw new Error("Unable to load the active draft.");
      }

      const draft = existingDraft ?? createDraft(userId, surveyType);
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

      state.drafts.set(stateKey, nextDraft);
      return cloneRecord(nextDraft);
    },

    async submitDraft({ userId, surveyType, answers }) {
      const definition = getActiveSurveyDefinition(surveyType);

      if (!definition) {
        throw new Error("This survey is not available for submissions.");
      }

      if (countAnswers(answers) !== definition.questionCount) {
        throw new Error(`Expected ${definition.questionCount} answers before submitting.`);
      }

      const stateKey = getStateKey(userId, surveyType);
      const draft = state.drafts.get(stateKey) ?? createDraft(userId, surveyType);
      const submittedAt = new Date().toISOString();
      const submission: SurveySubmission = {
        ...draft,
        answers: { ...answers },
        answerCount: definition.questionCount,
        status: "submitted",
        updatedAt: submittedAt,
        submittedAt,
      };

      state.drafts.delete(stateKey);
      const existingSubmissions = state.submissions.get(stateKey) ?? [];
      state.submissions.set(stateKey, [submission, ...existingSubmissions]);

      return cloneRecord(submission);
    },

    async getLatestSubmission(userId, surveyType) {
      const submission = state.submissions.get(getStateKey(userId, surveyType))?.[0] ?? null;
      return submission ? cloneRecord(submission) : null;
    },

    async getSubmissionById(userId, surveyType, submissionId) {
      const submission =
        state.submissions
          .get(getStateKey(userId, surveyType))
          ?.find((entry) => entry.submissionId === submissionId) ?? null;

      return submission ? cloneRecord(submission) : null;
    },

    async listSubmissions(userId, surveyType) {
      return (state.submissions.get(getStateKey(userId, surveyType)) ?? []).map((submission) =>
        toSubmissionSummary(cloneRecord(submission)),
      );
    },

    async getSurveyStatus(userId, surveyType) {
      const stateKey = getStateKey(userId, surveyType);
      const submissions = state.submissions.get(stateKey) ?? [];

      return {
        surveyType,
        submittedCount: submissions.length,
        hasActiveDraft: state.drafts.has(stateKey),
        latestSubmissionAt: submissions[0]?.submittedAt ?? null,
        latestSubmissionId: submissions[0]?.submissionId ?? null,
      } satisfies SurveyUserStatus;
    },
  };
}
