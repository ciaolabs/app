import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel, UIMessage } from "ai";
import { NextResponse } from "next/server";

import { getCurrentUserId } from "@ciaobang/auth";
import { getReadyDb } from "@ciaobang/db";
import { getChatRepository } from "@/lib/chat/repository";
import {
  EMPTY_SURVEY_CHAT_CONTEXT,
  surveyContextHasResults,
  type SurveyChatContext,
} from "@/lib/chat/survey-context";
import { loadSurveyChatContext } from "@/lib/chat-context-loader";
import { runChatTurn, type RagSearchCapability } from "@/lib/chat/turn";
import { runDevChatTurn } from "@/lib/chat/turn.dev-mock";
import { MODEL_OPTIONS, resolveUsableModel } from "@/lib/account/models";
import { getPreferences } from "@/lib/account/repository";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

type ChatRequestBody = {
  id?: string;
  threadId?: string | null;
  messages?: UIMessage[];
  temporary?: boolean;
  model?: string;
  surveyContext?: SurveyChatContext;
};

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

  // BYOK: the provider keys never live in our DB. The browser holds them
  // (localStorage) and sends them per turn over HTTPS; we use them transiently
  // to instantiate the SDK and run RAG embeddings, and never persist them.
  const anthropicKey = request.headers.get("x-anthropic-key")?.trim() || null;
  const googleKey = request.headers.get("x-google-key")?.trim() || null;

  // Only the model preference is read from the DB now (it is not sensitive);
  // the per-turn model from the request body still takes precedence.
  const [serverSurveyContext, preferences] = await Promise.all([
    loadSurveyChatContext(userId).catch(() => EMPTY_SURVEY_CHAT_CONTEXT),
    getPreferences(userId),
  ]);

  const surveyContext = surveyContextHasResults(serverSurveyContext)
    ? serverSurveyContext
    : body.surveyContext && surveyContextHasResults(body.surveyContext)
      ? body.surveyContext
      : serverSurveyContext;

  // Prefer the per-turn model from the request body, falling back to the stored
  // preference. resolveUsableModel substitutes a provider the user has a key for,
  // so we only 402 when no key is provided at all.
  const modelValue = resolveUsableModel(body.model ?? preferences.chatModel, {
    anthropic: !!anthropicKey,
    google: !!googleKey,
  });

  if (!modelValue) {
    logger.warn({ userId }, "Chat turn rejected: no usable API key");
    return NextResponse.json(
      {
        error:
          "No API key configured. Add an Anthropic or Google API key in Account Settings to start chatting.",
      },
      { status: 402 },
    );
  }

  const option = MODEL_OPTIONS.find((m) => m.value === modelValue)!;
  const model: LanguageModel =
    option.provider === "anthropic"
      ? createAnthropic({ apiKey: anthropicKey! })(option.value)
      : createGoogleGenerativeAI({ apiKey: googleKey! })(option.value);

  const ragSearch: RagSearchCapability | null = googleKey
    ? { googleApiKey: googleKey, sql: await getReadyDb() }
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
