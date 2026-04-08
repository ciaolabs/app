import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { getSurveyRepository } from "@/lib/survey/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const submission = await getSurveyRepository().getLatestSubmission(userId);
  return NextResponse.json({ submission });
}
