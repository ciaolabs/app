import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { getActiveSurveyDefinition } from "@/lib/survey/definitions";
import { answerPayloadSchema } from "@/lib/survey/schema";
import { getSurveyRepository } from "@/lib/survey/repository";

export const dynamic = "force-dynamic";

type SurveyRouteContext = {
  params: Promise<{ surveyType: string }>;
};

const FINAL_ATTEMPT_MESSAGE = "You have already used your final attempt for this survey.";

export async function PUT(request: Request, context: SurveyRouteContext) {
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
    const payload = answerPayloadSchema.parse(body);
    const question = definition.questionsById.get(payload.questionId);

    if (!question) {
      return NextResponse.json({ error: "Unknown question id." }, { status: 400 });
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

    const upsertParams: Parameters<typeof repository.upsertAnswer>[0] = {
      userId,
      surveyType: definition.type,
      questionId: payload.questionId,
      questionOrder: question.order,
      value: payload.value,
    };

    if (payload.submissionId) {
      upsertParams.submissionId = payload.submissionId;
    }

    const draft = await repository.upsertAnswer(upsertParams);

    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the answer.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
