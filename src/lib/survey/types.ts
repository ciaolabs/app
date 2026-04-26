export const PERSONALITY_RESPONSE_OPTION_LABELS = [
  "Very inaccurate",
  "Moderately inaccurate",
  "Slightly inaccurate",
  "Slightly accurate",
  "Moderately accurate",
  "Very accurate",
] as const;

export const BELIEFS_RESPONSE_OPTION_LABELS = [
  "Strongly agree",
  "Agree",
  "Slightly agree",
  "Slightly disagree",
  "Disagree",
  "Strongly disagree",
] as const;

export const VALUES_RESPONSE_OPTION_LABELS = [
  "Not like me at all",
  "Not like me",
  "A little like me",
  "Moderately like me",
  "Like me",
  "Very much like me",
] as const;

export const LIKERT_VALUES = [1, 2, 3, 4, 5, 6] as const;
export const LIKERT_LABELS = PERSONALITY_RESPONSE_OPTION_LABELS;

export const SURVEY_TYPES = ["personality", "values-beliefs"] as const;

export type LikertValue = (typeof LIKERT_VALUES)[number];
export type SurveyType = (typeof SURVEY_TYPES)[number];

export type SurveyAnswers = Record<string, LikertValue>;

export type QuestionResponseOption = {
  value: LikertValue;
  label: string;
};

export type QuestionResponseScale = {
  id: string;
  leftAnchor: string;
  rightAnchor: string;
  options: readonly QuestionResponseOption[];
};

export type QuestionSection = {
  id: string;
  title: string;
  shortTitle?: string;
  eyebrow?: string;
  description?: string;
};

export type QuestionVisual =
  | {
      kind: "violin";
      distribution: number[];
      title?: string;
    }
  | null;

export type QuestionItem = {
  id: string;
  order: number;
  prompt: string;
  responseScale: QuestionResponseScale;
  section?: QuestionSection | null;
  visual?: QuestionVisual;
};

export type SurveyStatus = "draft" | "submitted";

export type SurveyRecord = {
  submissionId: string;
  userId: string;
  surveyType: SurveyType;
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
  "submissionId" | "userId" | "surveyType" | "answerCount" | "createdAt" | "updatedAt" | "submittedAt"
>;

export type SurveyUserStatus = {
  surveyType: SurveyType;
  submittedCount: number;
  hasActiveDraft: boolean;
  latestSubmissionAt: string | null;
  latestSubmissionId: string | null;
};

export interface SurveyRepository {
  ensureDraft(userId: string, surveyType: SurveyType): Promise<SurveyDraft>;
  getDraft(userId: string, surveyType: SurveyType): Promise<SurveyDraft | null>;
  upsertAnswer(params: {
    userId: string;
    surveyType: SurveyType;
    submissionId?: string;
    questionId: string;
    questionOrder: number;
    value: LikertValue;
  }): Promise<SurveyDraft>;
  submitDraft(params: {
    userId: string;
    surveyType: SurveyType;
    answers: SurveyAnswers;
  }): Promise<SurveySubmission>;
  getLatestSubmission(userId: string, surveyType: SurveyType): Promise<SurveySubmission | null>;
  getSubmissionById(
    userId: string,
    surveyType: SurveyType,
    submissionId: string,
  ): Promise<SurveySubmission | null>;
  listSubmissions(userId: string, surveyType: SurveyType): Promise<SurveySubmissionSummary[]>;
  getSurveyStatus(userId: string, surveyType: SurveyType): Promise<SurveyUserStatus>;
}
