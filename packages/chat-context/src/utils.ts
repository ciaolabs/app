import type { SurveyChatContext } from "./types";

export const EMPTY_SURVEY_CHAT_CONTEXT: SurveyChatContext = {
  personality: null,
  valuesBeliefs: null,
};

export function surveyContextHasResults(context: SurveyChatContext) {
  return Boolean(context.personality || context.valuesBeliefs);
}

export function formatSurveyChatContext(context: SurveyChatContext) {
  return JSON.stringify(context, null, 2);
}

export function getSurveyContextAvailability(context: SurveyChatContext) {
  if (context.personality && context.valuesBeliefs) {
    return "personality and values-beliefs";
  }

  if (context.personality) {
    return "personality only";
  }

  if (context.valuesBeliefs) {
    return "values-beliefs only";
  }

  return "none";
}
