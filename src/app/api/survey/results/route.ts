import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { getSurveyRepository } from "@/lib/survey/repository";
import { buildSurveyResults } from "@/lib/survey/results/engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required.", results: null, submissions: [], selectedSubmissionId: null },
      { status: 401 },
    );
  }

  const repository = getSurveyRepository();
  const submissions = await repository.listSubmissions(userId);
  const requestedSubmissionId = new URL(request.url).searchParams.get("submissionId");
  const targetSubmissionId = requestedSubmissionId ?? submissions[0]?.submissionId ?? null;

  if (!targetSubmissionId) {
    return NextResponse.json({ results: null, submissions, selectedSubmissionId: null });
  }

  const submission = await repository.getSubmissionById(userId, targetSubmissionId);

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
