import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { getActiveSurveyDefinition } from "@/lib/survey/definitions";
import { getSurveyRepository } from "@/lib/survey/repository";
import { buildSurveyResults } from "@/lib/survey/results/engine";

export const dynamic = "force-dynamic";

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

  const repository = getSurveyRepository();
  const submissions = await repository.listSubmissions(userId, definition.type);
  const requestedSubmissionId = new URL(request.url).searchParams.get("submissionId");
  const targetSubmissionId = requestedSubmissionId ?? submissions[0]?.submissionId ?? null;

  if (!targetSubmissionId) {
    return NextResponse.json({ results: null, submissions, selectedSubmissionId: null });
  }

  const submission = await repository.getSubmissionById(userId, definition.type, targetSubmissionId);

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
    results: buildSurveyResults(submission),
    submissions,
    selectedSubmissionId: submission.submissionId,
  });
}
