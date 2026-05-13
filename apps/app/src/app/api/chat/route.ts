import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel, UIMessage } from "ai";
import { NextResponse } from "next/server";

import { getCurrentUserId } from "@ciaobang/auth";
import { getReadyDb } from "@ciaobang/db";
import { getChatRepository } from "@/lib/chat/repository";
import { surveyContextHasResults, type SurveyChatContext } from "@/lib/chat/survey-context";
import { loadSurveyChatContext } from "@/lib/chat/survey-context.server";
import { runChatTurn, type RagSearchCapability } from "@/lib/chat/turn";
import { runDevChatTurn } from "@/lib/chat/turn.dev-mock";
import { MODEL_OPTIONS } from "@/lib/account/models";
import { getDecryptedApiKey, getPreferences } from "@/lib/account/repository";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ChatRequestBody = {
  id?: string;
  threadId?: string | null;
  messages?: UIMessage[];
  temporary?: boolean;
  surveyContext?: SurveyChatContext;
};

async function selectModelForParticipant(userId: string): Promise<LanguageModel> {
  const { chatModel } = await getPreferences(userId);
  const option = MODEL_OPTIONS.find((m) => m.value === chatModel) ?? MODEL_OPTIONS[0]!;
  const apiKey = await getDecryptedApiKey(userId, option.provider);

  if (!apiKey) {
    const label = option.provider === "anthropic" ? "Anthropic" : "Google";
    throw new Error(
      `No ${label} API key configured. Add one in Account Settings to start chatting.`,
    );
  }

  if (option.provider === "anthropic") {
    return createAnthropic({ apiKey })(option.value);
  }
  return createGoogleGenerativeAI({ apiKey })(option.value);
}

function getLatestUserText(messages: UIMessage[]) {
  const latest = [...messages].reverse().find((m) => m.role === "user");
  if (!latest) return "";
  return latest.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    logger.warn("Chat request rejected: unauthenticated");
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
  }

  const messages = body.messages ?? [];

  if (!getLatestUserText(messages)) {
    return NextResponse.json({ error: "Message text is required." }, { status: 400 });
  }

  const temporary = body.temporary === true;

  logger.info({ userId, threadId: body.threadId, temporary }, "Chat turn starting");

  if (process.env.NODE_ENV === "development") {
    return runDevChatTurn({
      userId,
      surveyContext: body.surveyContext ?? { personality: null, valuesBeliefs: null },
      // The dev adapter ignores model and ragSearch; pass null as placeholders.
      model: null,
      ragSearch: null,
      messages,
      threadId: body.threadId ?? null,
      temporary,
      repository: getChatRepository(),
    });
  }

  const serverSurveyContext = await loadSurveyChatContext({ request, userId });
  const surveyContext = surveyContextHasResults(serverSurveyContext)
    ? serverSurveyContext
    : body.surveyContext && surveyContextHasResults(body.surveyContext)
      ? body.surveyContext
      : serverSurveyContext;

  if (!surveyContextHasResults(surveyContext)) {
    return NextResponse.json(
      { error: "Complete at least one survey before chatting." },
      { status: 409 },
    );
  }

  let model: LanguageModel;
  let participantGoogleApiKey: string | null;
  try {
    [model, participantGoogleApiKey] = await Promise.all([
      selectModelForParticipant(userId),
      getDecryptedApiKey(userId, "google"),
    ]);
  } catch (err) {
    logger.error({ userId, err }, "Model selection failed");
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI model not configured." },
      { status: 402 },
    );
  }

  const ragSearch: RagSearchCapability | null = participantGoogleApiKey
    ? { googleApiKey: participantGoogleApiKey, sql: await getReadyDb() }
    : null;

  logger.info(
    { userId, threadId: body.threadId, temporary, ragEnabled: ragSearch !== null },
    "Chat turn dispatched",
  );

  return runChatTurn({
    userId,
    surveyContext,
    model,
    ragSearch,
    messages,
    threadId: body.threadId ?? null,
    temporary,
    repository: getChatRepository(),
  });
}
