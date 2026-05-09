import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserId = vi.fn();
const getChatRepository = vi.fn();
const loadSurveyChatContext = vi.fn();
const streamText = vi.fn();
const convertToModelMessages = vi.fn();
const getPreferences = vi.fn();
const getDecryptedApiKey = vi.fn();
const createAnthropic = vi.fn();

vi.mock("@ciaobang/auth", () => ({
  getCurrentUserId,
}));

vi.mock("@/lib/chat/repository", () => ({
  getChatRepository,
}));

vi.mock("@/lib/chat/survey-context.server", () => ({
  loadSurveyChatContext,
}));

vi.mock("@/lib/account/repository", () => ({
  getPreferences,
  getDecryptedApiKey,
}));

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic,
}));

vi.mock("ai", () => ({
  convertToModelMessages,
  streamText,
  stepCountIs: vi.fn(),
}));

vi.mock("@ciaobang/db", () => ({
  getReadyDb: vi.fn().mockResolvedValue({}),
}));

vi.mock("@ciaobang/rag", () => ({
  makeSearchDocsTool: vi.fn().mockReturnValue({}),
}));

const surveyContext = {
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

describe("POST /api/chat", () => {
  const repository = {
    getThread: vi.fn(),
    createThread: vi.fn(),
    appendMessage: vi.fn(),
    listThreads: vi.fn(),
    renameThread: vi.fn(),
  };

  beforeEach(() => {
    vi.resetModules();
    getCurrentUserId.mockReset();
    getChatRepository.mockReset();
    loadSurveyChatContext.mockReset();
    streamText.mockReset();
    convertToModelMessages.mockReset();
    getPreferences.mockReset();
    getDecryptedApiKey.mockReset();
    createAnthropic.mockReset();
    repository.getThread.mockReset();
    repository.createThread.mockReset();
    repository.appendMessage.mockReset();
    repository.listThreads.mockReset();
    repository.renameThread.mockReset();

    getChatRepository.mockReturnValue(repository);
    loadSurveyChatContext.mockResolvedValue(surveyContext);
    convertToModelMessages.mockResolvedValue([{ role: "user", content: "Hello" }]);
    getPreferences.mockResolvedValue({ chatModel: "claude-sonnet-4-6" });
    getDecryptedApiKey.mockResolvedValue("sk-test-key");
    createAnthropic.mockReturnValue(() => "mock-model");
    repository.getThread.mockResolvedValue(null);
    repository.createThread.mockResolvedValue({
      id: "thread_1",
      userId: "user_123",
      title: "What stands out?",
      createdAt: "2026-05-01T10:00:00.000Z",
      updatedAt: "2026-05-01T10:00:00.000Z",
    });
    repository.appendMessage.mockResolvedValue({
      id: "message_1",
      threadId: "thread_1",
      role: "user",
      content: "What stands out?",
      createdAt: "2026-05-01T10:00:00.000Z",
    });
    streamText.mockImplementation(({ onFinish }) => ({
      toUIMessageStreamResponse: ({ headers }: { headers: HeadersInit }) => {
        void onFinish({ text: "A thoughtful response." });
        return new Response("stream", { headers });
      },
    }));
  });

  it("returns 401 for unauthenticated chat requests", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const { POST } = await import("@/app/api/chat/route");

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("rejects chat requests when no survey results exist", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    loadSurveyChatContext.mockResolvedValue({ personality: null, valuesBeliefs: null });
    const { POST } = await import("@/app/api/chat/route");

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ id: "m1", role: "user", parts: [{ type: "text", text: "Hi" }] }],
        }),
      }),
    );

    expect(response.status).toBe(409);
    expect(streamText).not.toHaveBeenCalled();
  });

  it("uses browser-refreshed survey context when the server-side context lookup is empty", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    loadSurveyChatContext.mockResolvedValue({ personality: null, valuesBeliefs: null });
    const { POST } = await import("@/app/api/chat/route");

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyContext,
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: "What stands out?" }],
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(streamText).toHaveBeenCalledWith(expect.objectContaining({
      system: expect.stringContaining("Data availability: personality only"),
    }));
  });

  it("creates a thread, streams a response, and persists both messages", async () => {
    getCurrentUserId.mockResolvedValue("user_123");
    const { POST } = await import("@/app/api/chat/route");

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: "What stands out?" }],
            },
          ],
        }),
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(response.headers.get("x-chat-thread-id")).toBe("thread_1");
    expect(repository.createThread).toHaveBeenCalledWith({
      userId: "user_123",
      title: "What stands out?",
    });
    expect(repository.appendMessage).toHaveBeenCalledWith({
      userId: "user_123",
      threadId: "thread_1",
      role: "user",
      content: "What stands out?",
    });
    expect(repository.appendMessage).toHaveBeenCalledWith({
      userId: "user_123",
      threadId: "thread_1",
      role: "assistant",
      content: "A thoughtful response.",
    });
  });
});
