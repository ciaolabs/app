import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { getCurrentUserId } from "@ciaobang/auth";

import { loadSurveyChatContext } from "@/lib/chat-context-loader";

export const dynamic = "force-dynamic";

function getInternalSurveyContextSecret() {
  return (
    process.env.SURVEY_CONTEXT_SECRET ||
    process.env.WORKOS_COOKIE_PASSWORD ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    null
  );
}

function verifyInternalUserId(request: Request) {
  const userId = request.headers.get("x-ciao-user-id")?.trim();
  const signature = request.headers.get("x-ciao-signature")?.trim();
  const secret = getInternalSurveyContextSecret();

  if (!userId || !signature || !secret) {
    return null;
  }

  const expected = createHmac("sha256", secret).update(userId).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  return userId;
}

export async function GET(request: Request) {
  const userId =
    verifyInternalUserId(request) ??
    (await getCurrentUserId({ acceptsSessionToken: true, request }));

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required.", context: null },
      { status: 401 },
    );
  }

  const context = await loadSurveyChatContext(userId);
  return NextResponse.json({ context });
}
