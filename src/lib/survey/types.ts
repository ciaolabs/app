export const LIKERT_LABELS = [
  "Very inaccurate",
  "Moderately inaccurate",
  "Slightly inaccurate",
  "Slightly accurate",
  "Moderately accurate",
  "Very accurate",
] as const;

export const LIKERT_VALUES = [1, 2, 3, 4, 5, 6] as const;

export type LikertValue = (typeof LIKERT_VALUES)[number];

export type SurveyAnswers = Record<string, LikertValue>;

export type QuestionItem = {
  id: string;
  order: number;
  prompt: string;
  labels: readonly string[];
  seededDistribution: number[];
};

export type SurveyStatus = "draft" | "submitted";

export type SurveyRecord = {
  submissionId: string;
  userId: string;
  status: SurveyStatus;
  answerCount: number;
  answers: SurveyAnswers;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
};

export type SurveyDraft = SurveyRecord & {
  status: "draft";
  submittedAt: null;
};

export type SurveySubmission = SurveyRecord & {
  status: "submitted";
  submittedAt: string;
};

export type SurveySubmissionSummary = Pick<
  SurveySubmission,
  "submissionId" | "userId" | "answerCount" | "createdAt" | "updatedAt" | "submittedAt"
>;

export interface SurveyRepository {
  ensureDraft(userId: string): Promise<SurveyDraft>;
  getDraft(userId: string): Promise<SurveyDraft | null>;
  upsertAnswer(params: {
    userId: string;
    questionId: string;
    questionOrder: number;
    value: LikertValue;
  }): Promise<SurveyDraft>;
  submitDraft(params: {
    userId: string;
    answers: SurveyAnswers;
  }): Promise<SurveySubmission>;
  getLatestSubmission(userId: string): Promise<SurveySubmission | null>;
  getSubmissionById(userId: string, submissionId: string): Promise<SurveySubmission | null>;
  listSubmissions(userId: string): Promise<SurveySubmissionSummary[]>;
}
