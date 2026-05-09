import { headers as nextHeaders } from "next/headers";
import { createHmac } from "node:crypto";

import {
  EMPTY_SURVEY_CHAT_CONTEXT,
  type SurveyChatContext,
} from "@/lib/chat/survey-context";

const DEFAULT_SURVEY_URL = "https://survey.ciaobang.com";

function getSurveyUrl() {
  return (
    process.env.SURVEY_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_SURVEY_URL ??
    DEFAULT_SURVEY_URL
  ).replace(/\/$/, "");
}

type LoadOptions = {
  request?: Request;
  userId?: string;
};

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

function signInternalUserId(userId: string) {
  const secret = getInternalSurveyContextSecret();
  if (!secret) return null;

  return createHmac("sha256", secret).update(userId).digest("hex");
}

async function buildForwardedHeaders(request?: Request): Promise<HeadersInit> {
  const result: Record<string, string> = {
    accept: "application/json",
  };

  if (request) {
    const cookie = request.headers.get("cookie");
    if (cookie) result.cookie = cookie;
    const authorization = request.headers.get("authorization");
    if (authorization) result.authorization = authorization;
    return result;
  }

  try {
    const incoming = await nextHeaders();
    const cookie = incoming.get("cookie");
    if (cookie) result.cookie = cookie;
    const authorization = incoming.get("authorization");
    if (authorization) result.authorization = authorization;
  } catch {
    // headers() is only available inside server components / route handlers
  }

  return result;
}

export async function loadSurveyChatContext(
  options: LoadOptions = {},
): Promise<SurveyChatContext> {
  const url = `${getSurveyUrl()}/api/internal/survey-context`;
  const headers = new Headers(await buildForwardedHeaders(options.request));
  const signature = options.userId ? signInternalUserId(options.userId) : null;

  if (options.userId && signature) {
    headers.set("x-ciao-user-id", options.userId);
    headers.set("x-ciao-signature", signature);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });
  } catch {
    return EMPTY_SURVEY_CHAT_CONTEXT;
  }

  if (!response.ok) {
    return EMPTY_SURVEY_CHAT_CONTEXT;
  }

  try {
    const payload = (await response.json()) as { context?: SurveyChatContext };
    return payload.context ?? EMPTY_SURVEY_CHAT_CONTEXT;
  } catch {
    return EMPTY_SURVEY_CHAT_CONTEXT;
  }
}
