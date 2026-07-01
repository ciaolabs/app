import { redirect } from "next/navigation";

import { requireCurrentUserId } from "@/lib/auth";
import {
  getActiveSurveyDefinition,
  surveyDefinitions,
  type SurveyDefinition,
} from "@/lib/survey/definitions";
import { getSurveyRepository } from "@/lib/survey/repository";
import { buildSurveyResults, createReferenceDistributionSource } from "@/lib/survey/results/engine";
import { loadInternalQuestionDistributionsSafe } from "@/lib/survey/results/reference-distributions";
import {
  type ResultsPayloadBySurveyType,
} from "@/lib/survey/results/types";
import { type SurveyDraft, type SurveyType, type SurveyUserStatus } from "@/lib/survey/types";

type SurveyStatusesByType = Record<SurveyType, SurveyUserStatus>;

async function loadStatusMap(
  userId: string,
  definitions: readonly SurveyDefinition[],
): Promise<SurveyStatusesByType> {
  const repository = getSurveyRepository();
  const statuses = await Promise.all(
    definitions.map(async (definition) => repository.getSurveyStatus(userId, definition.type)),
  );

  return Object.fromEntries(
    statuses.map((status) => [status.surveyType, status]),
  ) as SurveyStatusesByType;
}

export async function getInitialSurveyStatuses(
  definitions: readonly SurveyDefinition[] = surveyDefinitions,
) {
  const userId = await requireCurrentUserId();
  return loadStatusMap(userId, definitions);
}

export async function getRequiredSurveyDraft(surveyType: SurveyType): Promise<SurveyDraft> {
  const definition = getActiveSurveyDefinition(surveyType);

  if (!definition) {
    throw new Error("This survey is not available right now.");
  }

  const userId = await requireCurrentUserId();
  const repository = getSurveyRepository();
  const status = await repository.getSurveyStatus(userId, definition.type);

  if (
    definition.maxSubmissions !== null &&
    status.submittedCount >= definition.maxSubmissions &&
    !status.hasActiveDraft
  ) {
    redirect(definition.dashboardRoute);
  }

  if (status.hasActiveDraft) {
    const draft = await repository.getDraft(userId, definition.type);

    if (draft) {
      return draft;
    }
  }

  return repository.ensureDraft(userId, definition.type);
}

export async function getInitialDashboardPayload<Type extends SurveyType>(
  surveyType: Type,
): Promise<ResultsPayloadBySurveyType[Type]> {
  const definition = getActiveSurveyDefinition(surveyType);

  if (!definition || !definition.resultsEnabled) {
    throw new Error("This survey does not have results yet.");
  }

  const userId = await requireCurrentUserId();
  const repository = getSurveyRepository();
  const [submissions, latestSubmission, distributionSet] = await Promise.all([
    repository.listSubmissions(userId, definition.type),
    repository.getLatestSubmission(userId, definition.type),
    loadInternalQuestionDistributionsSafe(definition.type),
  ]);

  if (!latestSubmission) {
    return {
      results: null,
      submissions,
      selectedSubmissionId: null,
    } as ResultsPayloadBySurveyType[Type];
  }

  return {
    results: buildSurveyResults(latestSubmission, createReferenceDistributionSource(distributionSet)),
    submissions,
    selectedSubmissionId: latestSubmission.submissionId,
  } as ResultsPayloadBySurveyType[Type];
}
