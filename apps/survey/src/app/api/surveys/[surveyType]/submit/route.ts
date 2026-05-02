import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { getActiveSurveyDefinition } from "@/lib/survey/definitions";
import { getSurveyRepository } from "@/lib/survey/repository";
import { submitPayloadSchema, validateAnswerMap } from "@/lib/survey/schema";

export const dynamic = "force-dynamic";

type SurveyRouteContext = {
  params: Promise<{ surveyType: string }>;
};

const FINAL_ATTEMPT_MESSAGE = "You have already used your final attempt for this survey.";

export async function POST(request: Request, context: SurveyRouteContext) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { surveyType } = await context.params;
  const definition = getActiveSurveyDefinition(surveyType);

  if (!definition) {
    return NextResponse.json({ error: "This survey is not available right now." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const payload = submitPayloadSchema.parse(body);
    const answers = validateAnswerMap(definition.type, payload.answers);
    const repository = getSurveyRepository();
    const status = await repository.getSurveyStatus(userId, definition.type);

    if (definition.maxSubmissions !== null && status.submittedCount >= definition.maxSubmissions) {
      return NextResponse.json({ error: FINAL_ATTEMPT_MESSAGE }, { status: 403 });
    }

    const submission = await repository.submitDraft({
      userId,
      surveyType: definition.type,
      answers,
    });

    revalidatePath(definition.dashboardRoute);
    revalidatePath("/surveys");

    return NextResponse.json({ submission });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit the survey right now.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
