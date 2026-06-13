import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LanguageModel, UIMessage } from "ai";

import { createMemoryChatRepository } from "@/lib/chat/storage.memory";
import type { ChatRepository } from "@/lib/chat/types";
import type { SurveyChatContext } from "@/lib/chat/survey-context";

const streamText = vi.fn();
const convertToModelMessages = vi.fn();
const stepCountIs = vi.fn((n: number) => ({ kind: "stepCountIs", n }));
const makeSearchDocsTool = vi.fn(() => ({ kind: "search-docs-tool" }));

vi.mock("ai", () => ({
  streamText,
  convertToModelMessages,
  stepCountIs,
  tool: (definition: unknown) => definition,
}));

vi.mock("@ciaobang/rag", () => ({
  makeSearchDocsTool,
}));

const surveyContext: SurveyChatContext = {
  personality: {
    submittedAt: "2026-05-01T10:00:00.000Z",
    strongestScore: null,
    strongestPercentile: null,
    lowestScore: null,
    lowestPercentile: null,
    highestTraits: [],
    lowestTraits: [],
    frameworkOverviews: [],
  },
  valuesBeliefs: null,
};

function userMessage(text: string): UIMessage {
  return { id: `m-${text}`, role: "user", parts: [{ type: "text", text }] };
}

function captureStreamText(assistantText: string) {
  const seen: { args: Parameters<typeof streamText>[0] | null } = { args: null };
  streamText.mockImplementation((args: Parameters<typeof streamText>[0]) => {
    seen.args = args;
    return {
      toUIMessageStreamResponse: ({ headers }: { headers?: HeadersInit } = {}) => {
        // Trigger onFinish so persistence runs, then return a real Response.
        const finished = args.onFinish?.({ text: assistantText });
        const response = new Response("stream-body", {
          headers: headers ?? new Headers(),
        });
        // Surface the onFinish promise via a header for tests that need to await it.
        if (finished && typeof finished === "object" && "then" in finished) {
          (response as Response & { onFinishPromise?: Promise<unknown> }).onFinishPromise =
            finished as Promise<unknown>;
        }
        return response;
      },
    };
  });
  return seen;
}

async function awaitOnFinish(response: Response) {
  const promise = (response as Response & { onFinishPromise?: Promise<unknown> }).onFinishPromise;
  if (promise) await promise;
}

describe("runChatTurn", () => {
  let repository: ChatRepository;

  beforeEach(() => {
    streamText.mockReset();
    convertToModelMessages.mockReset();
    convertToModelMessages.mockResolvedValue([{ role: "user", content: "hi" }]);
    makeSearchDocsTool.mockClear();
    (globalThis as { __ambiMemoryChatState?: unknown }).__ambiMemoryChatState = undefined;
    repository = createMemoryChatRepository();
  });

  it("creates a thread on the first turn when no threadId is given", async () => {
    captureStreamText("A reflective answer.");
    const { runChatTurn } = await import("@/lib/chat/turn");

    const response = await runChatTurn({
      userId: "user_1",
      surveyContext,
      model: {} as LanguageModel,
      ragSearch: null,
      messages: [userMessage("What patterns stand out?")],
      threadId: null,
      temporary: false,
      repository,
    });
    await awaitOnFinish(response);

    const threads = await repository.listThreads("user_1");
    expect(threads).toHaveLength(1);
    expect(threads[0]!.title).toContain("What patterns stand out");
    expect(response.headers.get("x-chat-thread-id")).toBe(threads[0]!.id);
  });

  it("reuses an existing thread when its id is given", async () => {
    captureStreamText("Another answer.");
    const created = await repository.createThread({ userId: "user_1", title: "Existing" });
    const { runChatTurn } = await import("@/lib/chat/turn");

    const response = await runChatTurn({
      userId: "user_1",
      surveyContext,
      model: {} as LanguageModel,
      ragSearch: null,
      messages: [userMessage("Follow-up?")],
      threadId: created.id,
      temporary: false,
      repository,
    });
    await awaitOnFinish(response);

    const threads = await repository.listThreads("user_1");
    expect(threads).toHaveLength(1);
    expect(response.headers.get("x-chat-thread-id")).toBe(created.id);
  });

  it("persists both user and assistant messages on a non-temporary turn", async () => {
    captureStreamText("The assistant reply.");
    const { runChatTurn } = await import("@/lib/chat/turn");

    const response = await runChatTurn({
      userId: "user_1",
      surveyContext,
      model: {} as LanguageModel,
      ragSearch: null,
      messages: [userMessage("Hi there.")],
      threadId: null,
      temporary: false,
      repository,
    });
    await awaitOnFinish(response);

    const [thread] = await repository.listThreads("user_1");
    const stored = await repository.getThread("user_1", thread!.id);
    expect(stored!.messages).toEqual([
      expect.objectContaining({ role: "user", content: "Hi there." }),
      expect.objectContaining({ role: "assistant", content: "The assistant reply." }),
    ]);
  });

  it("does not persist anything when the turn is temporary", async () => {
    captureStreamText("Incognito reply.");
    const { runChatTurn } = await import("@/lib/chat/turn");

    const response = await runChatTurn({
      userId: "user_1",
      surveyContext,
      model: {} as LanguageModel,
      ragSearch: null,
      messages: [userMessage("Off the record.")],
      threadId: null,
      temporary: true,
      repository,
    });
    await awaitOnFinish(response);

    expect(await repository.listThreads("user_1")).toEqual([]);
    expect(response.headers.get("x-chat-thread-id")).toBeNull();
  });

  it("does not persist an assistant message when the model returns empty text", async () => {
    captureStreamText("   ");
    const { runChatTurn } = await import("@/lib/chat/turn");

    const response = await runChatTurn({
      userId: "user_1",
      surveyContext,
      model: {} as LanguageModel,
      ragSearch: null,
      messages: [userMessage("What?")],
      threadId: null,
      temporary: false,
      repository,
    });
    await awaitOnFinish(response);

    const [thread] = await repository.listThreads("user_1");
    const stored = await repository.getThread("user_1", thread!.id);
    expect(stored!.messages.map((m) => m.role)).toEqual(["user"]);
  });

  it("registers searchDocs only when a RAG search capability is provided", async () => {
    const seen = captureStreamText("ok");
    const { runChatTurn } = await import("@/lib/chat/turn");

    await runChatTurn({
      userId: "user_1",
      surveyContext,
      model: {} as LanguageModel,
      ragSearch: null,
      messages: [userMessage("no rag")],
      threadId: null,
      temporary: true,
      repository,
    });
    expect(Object.keys(seen.args!.tools!)).not.toContain("searchDocs");

    streamText.mockReset();
    const seenWith = captureStreamText("ok");
    convertToModelMessages.mockResolvedValue([{ role: "user", content: "hi" }]);

    await runChatTurn({
      userId: "user_1",
      surveyContext,
      model: {} as LanguageModel,
      ragSearch: { googleApiKey: "g-key", sql: {} as never },
      messages: [userMessage("with rag")],
      threadId: null,
      temporary: true,
      repository,
    });
    expect(Object.keys(seenWith.args!.tools!)).toContain("searchDocs");
    expect(makeSearchDocsTool).toHaveBeenCalledWith(surveyContext, {}, "g-key");
  });

  it("always registers the survey-context tools", async () => {
    const seen = captureStreamText("ok");
    const { runChatTurn } = await import("@/lib/chat/turn");

    await runChatTurn({
      userId: "user_1",
      surveyContext,
      model: {} as LanguageModel,
      ragSearch: null,
      messages: [userMessage("anything")],
      threadId: null,
      temporary: true,
      repository,
    });

    const toolNames = Object.keys(seen.args!.tools!);
    expect(toolNames).toContain("recallSurveyDetail");
    expect(toolNames).toContain("compareDimensions");
  });
});
