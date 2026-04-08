import { getCurrentUserId } from "@/lib/auth";
import { getSurveyRepository } from "@/lib/survey/repository";

export async function getInitialSurveyDraft() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  return getSurveyRepository().ensureDraft(userId);
}

export async function getLatestSubmittedSurvey() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  return getSurveyRepository().getLatestSubmission(userId);
}
