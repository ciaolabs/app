import { createHash } from "node:crypto";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type LanguageModel,
  type UIMessage,
} from "ai";

import type { Sql } from "@ciaobang/db";
import { makeSearchDocsTool } from "@ciaobang/rag";

import { makeSurveyContextTools } from "@/lib/chat/agent-tools";
import { buildChatSystemPrompt, createThreadTitle } from "@/lib/chat/prompt";
import type { SurveyChatContext } from "@/lib/chat/survey-context";
import type { ChatRepository } from "@/lib/chat/types";
import { makeWebResearchTools } from "@/lib/chat/web-research";

export type RagSearchCapability = { googleApiKey: string; sql: Sql };

export type ChatTurnInput = {
  userId: string;
  surveyContext: SurveyChatContext;
  model: LanguageModel;
  ragSearch: RagSearchCapability | null;
  messages: UIMessage[];
  threadId: string | null;
  temporary: boolean;
  repository: ChatRepository;
  webSearch?: boolean;
  abortSignal?: AbortSignal;
};

export type ChatTurn = (input: ChatTurnInput) => Promise<Response>;

function getLatestUserText(messages: UIMessage[]) {
  const latest = [...messages].reverse().find((m) => m.role === "user");
  if (!latest) return "";
  return latest.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export const runChatTurn: ChatTurn = async ({
  userId,
  surveyContext,
  model,
  ragSearch,
  messages,
  threadId,
  temporary,
  repository,
  webSearch,
  abortSignal,
}) => {
  const latestUserText = getLatestUserText(messages);

  const localTools = ragSearch
    ? {
        ...makeSurveyContextTools(surveyContext),
        searchDocs: makeSearchDocsTool(surveyContext, ragSearch.sql, ragSearch.googleApiKey),
      }
    : makeSurveyContextTools(surveyContext);

  const existingThread =
    !temporary && threadId ? await repository.getThread(userId, threadId) : null;
  const thread = temporary
    ? null
    : (existingThread ??
      (await repository.createThread({ userId, title: createThreadTitle(latestUserText) })));

  if (thread && latestUserText) {
    await repository.appendMessage({
      userId,
      threadId: thread.id,
      role: "user",
      content: latestUserText,
    });
  }

  // Hash local identifiers before sending a stable per-conversation quota ID.
  // Temporary chats reuse their first message ID without creating a Thread.
  const sessionId = createHash("sha256")
    .update(JSON.stringify([userId, thread?.id ?? messages[0]?.id]))
    .digest("hex");
  const webSearchEnabled = process.env.CIAO_WEB_SEARCH !== "off" && webSearch !== false;
  const tools = {
    ...localTools,
    ...(webSearchEnabled ? makeWebResearchTools(sessionId, abortSignal) : {}),
  };

  const result = streamText({
    model,
    system: buildChatSystemPrompt(surveyContext, webSearchEnabled),
    messages: await convertToModelMessages(messages),
    temperature: 0.6,
    tools,
    stopWhen: stepCountIs(6),
    abortSignal,
    onFinish: async ({ text }) => {
      if (!text.trim() || !thread) return;
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
};
