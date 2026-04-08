import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { buildSurveyResults } from "@/lib/survey/results/engine";
import { getSurveyRepository } from "@/lib/survey/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json({ error: "Authentication required.", results: null }, { status: 401 });
  }

  const submission = await getSurveyRepository().getLatestSubmission(userId);

  if (!submission) {
    return NextResponse.json({ results: null });
  }

  return NextResponse.json({ results: buildSurveyResults(submission) });
}
