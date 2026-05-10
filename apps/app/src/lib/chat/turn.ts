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
}) => {
  const latestUserText = getLatestUserText(messages);

  const tools = ragSearch
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

  const result = streamText({
    model,
    system: buildChatSystemPrompt(surveyContext),
    messages: await convertToModelMessages(messages),
    temperature: 0.6,
    tools,
    stopWhen: stepCountIs(6),
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
