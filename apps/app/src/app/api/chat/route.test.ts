import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserId = vi.fn();
const loadSurveyChatContext = vi.fn();
const getChatTurnCredentials = vi.fn();
const createAnthropic = vi.fn();
const runChatTurn = vi.fn();
const runDevChatTurn = vi.fn();
const getReadyDb = vi.fn();
const getChatRepository = vi.fn();

vi.mock("@ciaobang/auth", () => ({ getCurrentUserId }));
vi.mock("@/lib/chat/repository", () => ({ getChatRepository }));
vi.mock("@/lib/chat/survey-context.server", () => ({ loadSurveyChatContext }));
vi.mock("@/lib/account/repository", () => ({ getChatTurnCredentials }));
vi.mock("@ai-sdk/anthropic", () => ({ createAnthropic }));
vi.mock("@ai-sdk/google", () => ({ createGoogleGenerativeAI: vi.fn() }));
vi.mock("@ciaobang/db", () => ({ getReadyDb }));
vi.mock("@/lib/chat/turn", () => ({ runChatTurn }));
vi.mock("@/lib/chat/turn.dev-mock", () => ({ runDevChatTurn }));

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

describe("POST /api/chat (HTTP shape)", () => {
  beforeEach(() => {
    vi.resetModules();
    getCurrentUserId.mockReset();
    loadSurveyChatContext.mockReset();
    getChatTurnCredentials.mockReset();
    createAnthropic.mockReset();
    runChatTurn.mockReset();
    runDevChatTurn.mockReset();
    getReadyDb.mockReset();
    getChatRepository.mockReset();

    getChatRepository.mockReturnValue({});
    getReadyDb.mockResolvedValue({});
    getChatTurnCredentials.mockResolvedValue({
      chatModel: "claude-sonnet-4-6",
      anthropicKey: "sk-test-key",
      googleKey: "sk-test-key",
    });
    createAnthropic.mockReturnValue(() => "mock-model");
    loadSurveyChatContext.mockResolvedValue(surveyContext);
    runChatTurn.mockResolvedValue(new Response("ok", { headers: { "x-chat-thread-id": "t1" } }));
    runDevChatTurn.mockResolvedValue(new Response("dev"));
  });

  function buildRequest(body: unknown) {
    return new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 401 when the request is unauthenticated", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const { POST } = await import("@/app/api/chat/route");

    const response = await POST(buildRequest({ messages: [] }));

    expect(response.status).toBe(401);
    expect(runChatTurn).not.toHaveBeenCalled();
  });

  it("returns 400 when the request body is not JSON", async () => {
    getCurrentUserId.mockResolvedValue("user_1");
    const { POST } = await import("@/app/api/chat/route");

    const response = await POST(
      new Request("http://localhost/api/chat", { method: "POST", body: "not-json" }),
    );

    expect(response.status).toBe(400);
    expect(runChatTurn).not.toHaveBeenCalled();
  });

  it("returns 400 when no user message is present", async () => {
    getCurrentUserId.mockResolvedValue("user_1");
    const { POST } = await import("@/app/api/chat/route");

    const response = await POST(buildRequest({ messages: [] }));

    expect(response.status).toBe(400);
    expect(runChatTurn).not.toHaveBeenCalled();
  });

  it("falls through to a generic chat turn when no survey results exist", async () => {
    getCurrentUserId.mockResolvedValue("user_1");
    loadSurveyChatContext.mockResolvedValue({ personality: null, valuesBeliefs: null });
    runChatTurn.mockResolvedValue(new Response("ok"));
    const { POST } = await import("@/app/api/chat/route");

    const response = await POST(
      buildRequest({
        messages: [{ id: "m", role: "user", parts: [{ type: "text", text: "Hi" }] }],
      }),
    );

    expect(response.status).toBe(200);
    expect(runChatTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        surveyContext: { personality: null, valuesBeliefs: null },
      }),
    );
  });

  it("returns 402 when no API key is configured for the chosen provider", async () => {
    getCurrentUserId.mockResolvedValue("user_1");
    getChatTurnCredentials.mockResolvedValue({
      chatModel: "claude-sonnet-4-6",
      anthropicKey: null,
      googleKey: null,
    });
    const { POST } = await import("@/app/api/chat/route");

    const response = await POST(
      buildRequest({
        messages: [{ id: "m", role: "user", parts: [{ type: "text", text: "Hi" }] }],
      }),
    );

    expect(response.status).toBe(402);
    expect(runChatTurn).not.toHaveBeenCalled();
  });

  it("falls back to body-provided survey context when the server-side context is empty", async () => {
    getCurrentUserId.mockResolvedValue("user_1");
    loadSurveyChatContext.mockResolvedValue({ personality: null, valuesBeliefs: null });
    const { POST } = await import("@/app/api/chat/route");

    await POST(
      buildRequest({
        surveyContext,
        messages: [{ id: "m", role: "user", parts: [{ type: "text", text: "Hi" }] }],
      }),
    );

    expect(runChatTurn).toHaveBeenCalledWith(
      expect.objectContaining({ surveyContext, userId: "user_1" }),
    );
  });

  it("hands a fully-resolved input to runChatTurn and returns its response", async () => {
    getCurrentUserId.mockResolvedValue("user_1");
    const { POST } = await import("@/app/api/chat/route");

    const response = await POST(
      buildRequest({
        messages: [{ id: "m", role: "user", parts: [{ type: "text", text: "Hi" }] }],
        threadId: null,
        temporary: false,
      }),
    );

    expect(response.headers.get("x-chat-thread-id")).toBe("t1");
    expect(runChatTurn).toHaveBeenCalledTimes(1);
    const args = runChatTurn.mock.calls[0]![0];
    expect(args).toMatchObject({
      userId: "user_1",
      surveyContext,
      threadId: null,
      temporary: false,
    });
    expect(args.ragSearch).toEqual({ googleApiKey: "sk-test-key", sql: {} });
    expect(args.model).toBeDefined();
    expect(args.repository).toBeDefined();
  });

  it("omits the RAG capability when no Google API key is configured", async () => {
    getCurrentUserId.mockResolvedValue("user_1");
    getChatTurnCredentials.mockResolvedValue({
      chatModel: "claude-sonnet-4-6",
      anthropicKey: "sk-anthropic",
      googleKey: null,
    });
    const { POST } = await import("@/app/api/chat/route");

    await POST(
      buildRequest({
        messages: [{ id: "m", role: "user", parts: [{ type: "text", text: "Hi" }] }],
      }),
    );

    expect(runChatTurn).toHaveBeenCalledWith(expect.objectContaining({ ragSearch: null }));
  });

  it("uses the per-turn model from the request body in preference to the stored model", async () => {
    getCurrentUserId.mockResolvedValue("user_1");
    const inner = vi.fn(() => "mock-model");
    createAnthropic.mockReturnValue(inner);
    const { POST } = await import("@/app/api/chat/route");

    await POST(
      buildRequest({
        model: "claude-haiku-4-5-20251001",
        messages: [{ id: "m", role: "user", parts: [{ type: "text", text: "Hi" }] }],
      }),
    );

    // body model wins over the stored preference for this turn
    expect(inner).toHaveBeenCalledWith("claude-haiku-4-5-20251001");
  });

  it("falls back to a usable provider's model instead of 402 when the chosen provider has no key", async () => {
    getCurrentUserId.mockResolvedValue("user_1");
    // Anthropic-only user whose (stored) model is a Google one.
    getChatTurnCredentials.mockResolvedValue({
      chatModel: "gemini-flash-lite-latest",
      anthropicKey: "sk-anthropic",
      googleKey: null,
    });
    const inner = vi.fn(() => "mock-model");
    createAnthropic.mockReturnValue(inner);
    const { POST } = await import("@/app/api/chat/route");

    const response = await POST(
      buildRequest({
        messages: [{ id: "m", role: "user", parts: [{ type: "text", text: "Hi" }] }],
      }),
    );

    expect(response.status).toBe(200);
    // resolved to an Anthropic model rather than 402ing on the unusable Google default
    expect(inner).toHaveBeenCalledWith(expect.stringMatching(/^claude-/));
    expect(runChatTurn).toHaveBeenCalledTimes(1);
  });

  it("does not use server Google env vars for RAG when the participant has no Google key", async () => {
    process.env.RAG_GOOGLE_API_KEY = "server-google-key";
    process.env.GOOGLE_API_KEY = "server-google-key";
    getCurrentUserId.mockResolvedValue("user_1");
    getChatTurnCredentials.mockResolvedValue({
      chatModel: "claude-sonnet-4-6",
      anthropicKey: "sk-anthropic",
      googleKey: null,
    });
    const { POST } = await import("@/app/api/chat/route");

    await POST(
      buildRequest({
        messages: [{ id: "m", role: "user", parts: [{ type: "text", text: "Hi" }] }],
      }),
    );

    expect(runChatTurn).toHaveBeenCalledWith(expect.objectContaining({ ragSearch: null }));
    expect(getReadyDb).not.toHaveBeenCalled();
  });
});
