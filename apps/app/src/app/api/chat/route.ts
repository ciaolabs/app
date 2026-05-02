import { createGateway } from "@ai-sdk/gateway";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";

import { getCurrentUserId } from "@ciaobang/auth";
import { getChatRepository } from "@/lib/chat/repository";
import { buildChatSystemPrompt, createThreadTitle } from "@/lib/chat/prompt";
import { surveyContextHasResults } from "@/lib/chat/survey-context";
import { loadSurveyChatContext } from "@/lib/chat/survey-context.server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ChatRequestBody = {
  id?: string;
  threadId?: string | null;
  messages?: UIMessage[];
  temporary?: boolean;
};

function getGatewayModel() {
  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });

  return gateway(process.env.VERCEL_AI_GATEWAY_MODEL ?? "google/gemini-2.5-flash");
}

function getTextFromMessage(message: UIMessage | undefined) {
  if (!message) {
    return "";
  }

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
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const latestUserText = getTextFromMessage(latestUserMessage);

  if (!latestUserText) {
    return NextResponse.json({ error: "Message text is required." }, { status: 400 });
  }

  const [surveyContext, repository] = await Promise.all([
    loadSurveyChatContext({ request }),
    Promise.resolve(getChatRepository()),
  ]);

  if (!surveyContextHasResults(surveyContext)) {
    return NextResponse.json(
      {
        error:
          "Complete at least one survey before chatting so I can personalize your feedback.",
      },
      { status: 409 },
    );
  }

  const isTemporary = body.temporary === true;

  const existingThread =
    !isTemporary && body.threadId ? await repository.getThread(userId, body.threadId) : null;
  const thread = isTemporary
    ? null
    : (existingThread ??
      (await repository.createThread({
        userId,
        title: createThreadTitle(latestUserText),
      })));

  if (thread) {
    await repository.appendMessage({
      userId,
      threadId: thread.id,
      role: "user",
      content: latestUserText,
    });
  }

  const result = streamText({
    model: getGatewayModel(),
    system: buildChatSystemPrompt(surveyContext),
    messages: await convertToModelMessages(messages),
    temperature: 0.6,
    onFinish: async ({ text }) => {
      if (!text.trim() || !thread) {
        return;
      }

      await repository.appendMessage({
        userId,
        threadId: thread.id,
        role: "assistant",
        content: text,
      });
    },
  });

  return result.toUIMessageStreamResponse({
    headers: thread ? { "x-chat-thread-id": thread.id } : undefined,
  });
}
