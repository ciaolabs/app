import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { getSurveyRepository } from "@/lib/survey/repository";
import { submitPayloadSchema, validateAnswerMap } from "@/lib/survey/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = submitPayloadSchema.parse(body);
    const answers = validateAnswerMap(payload.answers);
    const submission = await getSurveyRepository().submitDraft({
      userId,
      answers,
    });

    return NextResponse.json({ submission });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit the survey right now.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
