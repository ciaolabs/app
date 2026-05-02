import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { getActiveSurveyDefinition } from "@/lib/survey/definitions";
import { getSurveyRepository } from "@/lib/survey/repository";

export const dynamic = "force-dynamic";

type SurveyRouteContext = {
  params: Promise<{ surveyType: string }>;
};

const FINAL_ATTEMPT_MESSAGE = "You have already used your final attempt for this survey.";

export async function GET(request: Request, context: SurveyRouteContext) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { surveyType } = await context.params;
  const definition = getActiveSurveyDefinition(surveyType);

  if (!definition) {
    return NextResponse.json({ error: "This survey is not available right now." }, { status: 404 });
  }

  const repository = getSurveyRepository();
  const status = await repository.getSurveyStatus(userId, definition.type);

  if (
    definition.maxSubmissions !== null &&
    status.submittedCount >= definition.maxSubmissions &&
    !status.hasActiveDraft
  ) {
    return NextResponse.json({ error: FINAL_ATTEMPT_MESSAGE }, { status: 403 });
  }

  const draft = status.hasActiveDraft
    ? await repository.getDraft(userId, definition.type)
    : await repository.ensureDraft(userId, definition.type);

  if (!draft) {
    return NextResponse.json({ error: "Unable to load your current draft." }, { status: 500 });
  }

  return NextResponse.json({ draft });
}
