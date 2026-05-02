import { headers as nextHeaders } from "next/headers";

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
};

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
  const headers = await buildForwardedHeaders(options.request);

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
