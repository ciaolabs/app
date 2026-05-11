import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { getActiveSurveyDefinition } from "@/lib/survey/definitions";
import { checkSurveyAction } from "@/lib/survey/lifecycle";
import { getSurveyRepository } from "@/lib/survey/repository";
import { submitPayloadSchema, validateAnswerMap } from "@/lib/survey/schema";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type SurveyRouteContext = {
  params: Promise<{ surveyType: string }>;
};

export async function POST(request: Request, context: SurveyRouteContext) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    logger.warn({ surveyType: "unknown" }, "Survey submit rejected: unauthenticated");
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
    const decision = checkSurveyAction(definition, status, "submit");

    if (!decision.allowed) {
      logger.warn({ userId, surveyType, reason: decision.reason }, "Survey submit blocked: out of attempts");
      return NextResponse.json({ error: decision.message }, { status: 403 });
    }

    const submission = await repository.submitDraft({
      userId,
      surveyType: definition.type,
      answers,
    });

    revalidatePath(definition.dashboardRoute);
    revalidatePath("/surveys");

    logger.info({ userId, surveyType, submissionId: submission.submissionId }, "Survey submitted successfully");

    return NextResponse.json({ submission });
  } catch (error) {
    logger.error({ userId, surveyType, error }, "Survey submission failed");
    const message =
      error instanceof Error ? error.message : "Unable to submit the survey right now.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
