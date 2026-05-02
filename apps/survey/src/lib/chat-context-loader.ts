import {
  personalitySurveyDefinition,
  valuesBeliefsSurveyDefinition,
} from "@/lib/survey/definitions";
import { getSurveyRepository } from "@/lib/survey/repository";
import { buildSurveyResults } from "@/lib/survey/results/engine";
import type { AnySurveyResults } from "@/lib/survey/results/types";

import {
  buildSurveyChatContextFromResults,
  type SurveyChatContext,
} from "@/lib/chat-context-builder";

export async function loadSurveyChatContext(userId: string): Promise<SurveyChatContext> {
  const repository = getSurveyRepository();
  const [personalitySubmission, valuesBeliefsSubmission] = await Promise.all([
    repository.getLatestSubmission(userId, personalitySurveyDefinition.type),
    repository.getLatestSubmission(userId, valuesBeliefsSurveyDefinition.type),
  ]);

  const results: AnySurveyResults[] = [];

  if (personalitySubmission) {
    results.push(buildSurveyResults(personalitySubmission));
  }

  if (valuesBeliefsSubmission) {
    results.push(buildSurveyResults(valuesBeliefsSubmission));
  }

  return buildSurveyChatContextFromResults(results);
}
