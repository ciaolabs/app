import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { getSurveyDefinition } from "@/lib/survey/definitions";
import { getSurveyRepository } from "@/lib/survey/repository";

export const dynamic = "force-dynamic";

type SurveyRouteContext = {
  params: Promise<{ surveyType: string }>;
};

export async function GET(request: Request, context: SurveyRouteContext) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json({ error: "Authentication required.", status: null }, { status: 401 });
  }

  const { surveyType } = await context.params;
  const definition = getSurveyDefinition(surveyType);

  if (!definition) {
    return NextResponse.json({ error: "Unknown survey.", status: null }, { status: 404 });
  }

  const status = await getSurveyRepository().getSurveyStatus(userId, definition.type);
  return NextResponse.json({ status });
}
