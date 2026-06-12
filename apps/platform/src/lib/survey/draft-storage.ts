import { getPendingResultsKey, getStoredAnswersKey } from "@/lib/survey/definitions";
import { type SurveyAnswers, type SurveyType } from "@/lib/survey/types";

const PENDING_RESULTS_WINDOW_MS = 5 * 60 * 1000;

export const sessionDraftStorage = {
  readAnswers(surveyType: SurveyType): SurveyAnswers {
    if (typeof window === "undefined") return {};

    const raw = window.sessionStorage.getItem(getStoredAnswersKey(surveyType));

    if (!raw) return {};

    try {
      const parsed = JSON.parse(raw) as Record<string, number>;
      return Object.fromEntries(
        Object.entries(parsed).map(([id, value]) => [id, Number(value)]),
      ) as SurveyAnswers;
    } catch {
      return {};
    }
  },

  writeAnswers(surveyType: SurveyType, answers: SurveyAnswers): void {
    if (typeof window === "undefined") return;

    const key = getStoredAnswersKey(surveyType);

    if (Object.keys(answers).length === 0) {
      window.sessionStorage.removeItem(key);
      return;
    }

    window.sessionStorage.setItem(key, JSON.stringify(answers));
  },

  clearAnswers(surveyType: SurveyType): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(getStoredAnswersKey(surveyType));
  },

  markPendingResults(surveyType: SurveyType, submittedAt: string | null): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      getPendingResultsKey(surveyType),
      submittedAt ?? new Date().toISOString(),
    );
  },

  hasPendingResults(surveyType: SurveyType): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(window.sessionStorage.getItem(getPendingResultsKey(surveyType)));
  },

  clearPendingResults(surveyType: SurveyType): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(getPendingResultsKey(surveyType));
  },

  shouldRedirectToDashboard(surveyType: SurveyType, answerCount: number): boolean {
    if (typeof window === "undefined") return false;

    const key = getPendingResultsKey(surveyType);
    const pendingMarker = window.sessionStorage.getItem(key);

    if (!pendingMarker) return false;

    const markerTimestamp = Date.parse(pendingMarker);
    const isMarkerFresh =
      Number.isFinite(markerTimestamp) &&
      Date.now() - markerTimestamp <= PENDING_RESULTS_WINDOW_MS;
    const hasUnansweredDraft = answerCount === 0;

    if (isMarkerFresh && hasUnansweredDraft) return true;

    window.sessionStorage.removeItem(key);
    return false;
  },
};

export type DraftStorage = typeof sessionDraftStorage;
