import { type SurveyType } from "@/lib/survey/types";

export const SURVEYS_ROUTE = "/surveys";

export function getSurveyRoute(surveyType: SurveyType) {
  return `${SURVEYS_ROUTE}/${surveyType}`;
}

export function getSurveyDashboardRoute(surveyType: SurveyType) {
  return `${getSurveyRoute(surveyType)}/dashboard`;
}

export function getSurveyApiBasePath(surveyType: SurveyType) {
  return `/api/surveys/${surveyType}`;
}
