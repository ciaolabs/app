import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type LanguageModel,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";

import { getCurrentUserId } from "@ciaobang/auth";
import { getReadyDb } from "@ciaobang/db";
import { makeSearchDocsTool } from "@ciaobang/rag";
import { getChatRepository } from "@/lib/chat/repository";
import { buildChatSystemPrompt, createThreadTitle } from "@/lib/chat/prompt";
import { surveyContextHasResults, type SurveyChatContext } from "@/lib/chat/survey-context";
import { loadSurveyChatContext } from "@/lib/chat/survey-context.server";
import { MODEL_OPTIONS } from "@/lib/account/models";
import { getDecryptedApiKey, getPreferences } from "@/lib/account/repository";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ChatRequestBody = {
  id?: string;
  threadId?: string | null;
  messages?: UIMessage[];
  temporary?: boolean;
  surveyContext?: SurveyChatContext;
};

function createDevMockResponse(): Response {
  const chunks = [
    "🧪 **Dev mode** — this is a simulated response. ",
    "No API tokens were used. ",
    "Add your Anthropic or Google API key in [Account Settings](/account) for real responses.",
  ];
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
        await new Promise((r) => setTimeout(r, 40));
      }
      controller.enqueue(
        encoder.encode(
          `e:${JSON.stringify({ finishReason: "stop", usage: { promptTokens: 0, completionTokens: 0 } })}\n`,
        ),
      );
      controller.enqueue(
        encoder.encode(
          `d:${JSON.stringify({ finishReason: "stop", usage: { promptTokens: 0, completionTokens: 0 } })}\n`,
        ),
      );
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
    },
  });
}

async function getUserModel(userId: string): Promise<LanguageModel> {

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

function getTextFromMessage(message: UIMessage | undefined) {
  if (!message) return "";
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const latestUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const latestUserText = getTextFromMessage(latestUserMessage);

  if (!latestUserText) {
    return NextResponse.json({ error: "Message text is required." }, { status: 400 });
  }

  if (process.env.NODE_ENV === "development") {
    return createDevMockResponse();
  }

  const [serverSurveyContext, repository] = await Promise.all([
    loadSurveyChatContext({ request, userId }),
    Promise.resolve(getChatRepository()),
  ]);
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
  let googleApiKey: string | null;
  try {
    [model, googleApiKey] = await Promise.all([
      getUserModel(userId),
      getDecryptedApiKey(userId, "google"),
    ]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI model not configured." },
      { status: 402 },
    );
  }

  const tools =
    googleApiKey
      ? { searchDocs: makeSearchDocsTool(surveyContext, await getReadyDb(), googleApiKey) }
      : undefined;

  const isTemporary = body.temporary === true;
  const existingThread =
    !isTemporary && body.threadId ? await repository.getThread(userId, body.threadId) : null;
  const thread = isTemporary
    ? null
    : (existingThread ??
      (await repository.createThread({ userId, title: createThreadTitle(latestUserText) })));

  if (thread) {
    await repository.appendMessage({ userId, threadId: thread.id, role: "user", content: latestUserText });
  }

  const result = streamText({
    model,
    system: buildChatSystemPrompt(surveyContext),
    messages: await convertToModelMessages(messages),
    temperature: 0.6,
    ...(tools ? { tools, stopWhen: stepCountIs(3) } : {}),
    onFinish: async ({ text }) => {
      if (!text.trim() || !thread) return;
      await repository.appendMessage({ userId, threadId: thread.id, role: "assistant", content: text });
    },
  });

  return result.toUIMessageStreamResponse({
    headers: thread ? { "x-chat-thread-id": thread.id } : undefined,
  });
}
