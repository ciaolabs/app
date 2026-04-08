import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { QUESTION_LOOKUP } from "@/lib/survey/questions";
import { answerPayloadSchema } from "@/lib/survey/schema";
import { getSurveyRepository } from "@/lib/survey/repository";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = answerPayloadSchema.parse(body);
    const question = QUESTION_LOOKUP.get(payload.questionId);

    if (!question) {
      return NextResponse.json({ error: "Unknown question id." }, { status: 400 });
    }

    const draft = await getSurveyRepository().upsertAnswer({
      userId,
      questionId: payload.questionId,
      questionOrder: question.order,
      value: payload.value,
    });

    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the answer.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
