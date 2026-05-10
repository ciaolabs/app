/**
 * External API contract for the survey results endpoints.
 *
 * All internal scoring types must be mapped through this module before being
 * returned from any API route. Even when the mapping is currently an identity
 * function, keeping this boundary explicit means future breaking changes to
 * internal types (e.g. adding raw answer data, intermediate computation
 * artefacts, or database-specific fields) cannot accidentally leak into the
 * public API surface.
 *
 * Consumers of the survey results API should import the DTO types from here,
 * not directly from `@/lib/survey/results/types`.
 */

import type {
  AnySurveyResults,
  PersonalitySurveyResults,
  ValuesBeliefsResults,
} from "@/lib/survey/results/types";

export type { AnySurveyResults, PersonalitySurveyResults, ValuesBeliefsResults };

/**
 * The shape returned by `GET /api/surveys/[surveyType]/results`.
 *
 * `results` is the DTO form of the survey results (currently structurally
 * identical to the internal type, but always passed through
 * `toSurveyResultsDto` to maintain the seam).
 */
export type SurveyResultsApiResponse = {
  results: AnySurveyResults | null;
  submissions: import("@/lib/survey/types").SurveySubmissionSummary[];
  selectedSubmissionId: string | null;
  error?: string;
};

/**
 * Maps internal survey results to the API DTO.
 *
 * Currently an identity mapping — the internal and external shapes are the
 * same. This function exists to establish the seam: route handlers must call
 * it rather than returning internal results directly, so that changes to
 * internal types can be absorbed here without touching routes or consumers.
 */
export function toSurveyResultsDto(results: AnySurveyResults): AnySurveyResults {
  return results;
}
