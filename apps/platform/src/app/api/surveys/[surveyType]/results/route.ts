import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { toSurveyResultsDto } from "@/lib/survey/api-types";
import { getActiveSurveyDefinition } from "@/lib/survey/definitions";
import { getSurveyRepository } from "@/lib/survey/repository";
import { buildSurveyResults, createReferenceDistributionSource } from "@/lib/survey/results/engine";
import { loadInternalQuestionDistributionsSafe } from "@/lib/survey/results/reference-distributions";


type SurveyRouteContext = {
  params: Promise<{ surveyType: string }>;
};

export async function GET(request: Request, context: SurveyRouteContext) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required.", results: null, submissions: [], selectedSubmissionId: null },
      { status: 401 },
    );
  }

  const { surveyType } = await context.params;
  const definition = getActiveSurveyDefinition(surveyType);

  if (!definition || !definition.resultsEnabled) {
    return NextResponse.json(
      { error: "This survey does not have results yet.", results: null, submissions: [], selectedSubmissionId: null },
      { status: 404 },
    );
  }

  const requestedSubmissionId = new URL(request.url).searchParams.get("submissionId");
  const repository = getSurveyRepository();
  const submissionsPromise = repository.listSubmissions(userId, definition.type);
  const submissionPromise = requestedSubmissionId
    ? repository.getSubmissionById(userId, definition.type, requestedSubmissionId)
    : repository.getLatestSubmission(userId, definition.type);
  const distributionPromise = loadInternalQuestionDistributionsSafe(definition.type);
  const [submissions, submission, distributionSet] = await Promise.all([
    submissionsPromise,
    submissionPromise,
    distributionPromise,
  ]);

  if (!requestedSubmissionId && !submission && submissions.length === 0) {
    return NextResponse.json({ results: null, submissions, selectedSubmissionId: null });
  }

  if (!submission) {
    return NextResponse.json(
      {
        error: "The selected survey results are not available for this account.",
        results: null,
        submissions,
        selectedSubmissionId: null,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    results: toSurveyResultsDto(
      buildSurveyResults(submission, createReferenceDistributionSource(distributionSet)),
    ),
    submissions,
    selectedSubmissionId: submission.submissionId,
  });
}
