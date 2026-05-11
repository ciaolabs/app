import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { getCurrentUserId } from "@ciaobang/auth";

import { loadSurveyChatContext } from "@/lib/chat-context-loader";

export const dynamic = "force-dynamic";

const DEFAULT_APP_URL = "https://app.ciaobang.com";

function getAllowedOrigins() {
  return new Set(
    [process.env.NEXT_PUBLIC_APP_URL, DEFAULT_APP_URL, "http://app.ciaobang.local:3001"]
      .filter((origin): origin is string => Boolean(origin))
      .map((origin) => origin.replace(/\/$/, "")),
  );
}

function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin")?.replace(/\/$/, "");

  if (!origin || !getAllowedOrigins().has(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "authorization, content-type, x-ciao-signature, x-ciao-user-id",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
}

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

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function GET(request: Request) {
  const corsHeaders = getCorsHeaders(request);
  const userId =
    verifyInternalUserId(request) ??
    (await getCurrentUserId({ acceptsSessionToken: true, request }));

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required.", context: null },
      { status: 401, headers: corsHeaders },
    );
  }

  const context = await loadSurveyChatContext(userId);
  return NextResponse.json({ context }, { headers: corsHeaders });
}
