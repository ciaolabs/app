import { createHmac } from "node:crypto";
import { EMPTY_SURVEY_CHAT_CONTEXT, type SurveyChatContext } from "@ciaobang/chat-context";

const DEFAULT_SURVEY_URL = "https://survey.ciaobang.com";

function getSurveyUrl() {
  return (
    process.env.SURVEY_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_SURVEY_URL ??
    DEFAULT_SURVEY_URL
  ).replace(/\/$/, "");
}

function getSecret() {
  return (
    process.env.SURVEY_CONTEXT_SECRET ||
    process.env.WORKOS_COOKIE_PASSWORD ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    null
  );
}

function signUserId(userId: string) {
  const secret = getSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(userId).digest("hex");
}

type LoadOptions = {
  request: Request;
  userId?: string;
};

export async function loadSurveyChatContext({
  request,
  userId,
}: LoadOptions): Promise<SurveyChatContext> {
  const url = `${getSurveyUrl()}/api/internal/survey-context`;

  const headers: Record<string, string> = { accept: "application/json" };

  const cookie = request.headers.get("cookie");
  if (cookie) headers.cookie = cookie;

  const authorization = request.headers.get("authorization");
  if (authorization) headers.authorization = authorization;

  if (userId) {
    const signature = signUserId(userId);
    if (signature) {
      headers["x-ciao-user-id"] = userId;
      headers["x-ciao-signature"] = signature;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, { method: "GET", headers, cache: "no-store" });
  } catch {
    return EMPTY_SURVEY_CHAT_CONTEXT;
  }

  if (!response.ok) return EMPTY_SURVEY_CHAT_CONTEXT;

  try {
    const payload = (await response.json()) as { context?: SurveyChatContext };
    return payload.context ?? EMPTY_SURVEY_CHAT_CONTEXT;
  } catch {
    return EMPTY_SURVEY_CHAT_CONTEXT;
  }
}
