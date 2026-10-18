// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";

import { runChatTurn, type ChatTurnInput } from "@/lib/chat/turn";
import { createMemoryChatRepository } from "@/lib/chat/storage.memory";

type StreamResult = Awaited<ReturnType<MockLanguageModelV4["doStream"]>>;
type Chunk = StreamResult["stream"] extends ReadableStream<infer T> ? T : never;
type Call = { name: string; args: Record<string, unknown> };
const SOURCE = "https://doi.org/10.1037/a0015038";
const QUERY = "personality assessment research sources";
const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};

/** Scripted model, real AI SDK tool dispatch and result consumption. */
function scriptedModel(calls: Call[], consume: (prompt: string) => string = () => "Done.") {
  let step = 0;
  return new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      const call = calls[step++];
      const chunks: Chunk[] = [{ type: "stream-start", warnings: [] }];
      if (call) {
        chunks.push({ type: "tool-call", toolCallId: `call-${step}`, toolName: call.name, input: JSON.stringify(call.args) });
      } else {
        chunks.push(
          { type: "text-start", id: "answer" },
          { type: "text-delta", id: "answer", delta: consume(JSON.stringify(prompt)) },
          { type: "text-end", id: "answer" },
        );
      }
      chunks.push({ type: "finish", finishReason: { unified: call ? "tool-calls" : "stop", raw: undefined }, usage });
      return { stream: simulateReadableStream({ chunks, initialDelayInMs: null, chunkDelayInMs: null }) };
    },
  });
}

function input(model: MockLanguageModelV4, overrides: Partial<ChatTurnInput> = {}): ChatTurnInput {
  return {
    userId: "private-user-id",
    surveyContext: { personality: null, valuesBeliefs: null },
    model,
    ragSearch: null,
    messages: [{ id: "conversation-first-message", role: "user", parts: [{ type: "text", text: QUERY }] }],
    threadId: null,
    temporary: true,
    repository: createMemoryChatRepository(),
    ...overrides,
  };
}

type Rpc = { id?: string | number; method: string; params?: { name?: string; arguments?: Record<string, unknown> } };

function mcpFixture(onCall?: (rpc: Rpc, signal?: AbortSignal | null) => unknown | Promise<unknown>) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    expect(String(url)).toBe("https://search.parallel.ai/mcp");
    const headers = new Headers(init?.headers);
    expect(headers.get("user-agent")).toContain("Ciao-Platform/0.1.0");
    expect(headers.has("authorization")).toBe(false);
    if (!init?.body) return new Response(null, { status: 405 });
    const rpc = JSON.parse(String(init?.body)) as Rpc;
    let result: unknown;
    switch (rpc.method) {
      case "initialize":
        result = { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "parallel-fixture", version: "1" } };
        break;
      case "notifications/initialized":
        return new Response(null, { status: 202 });
      case "tools/list":
        result = { tools: ["web_search", "web_fetch"].map((name) => ({ name, inputSchema: { type: "object" } })) };
        break;
      case "tools/call":
        result = onCall ? await onCall(rpc, init?.signal) : {
          content: [{ type: "text", text: JSON.stringify({ results: [{ url: SOURCE, excerpts: ["Research source excerpt."] }] }) }],
        };
        break;
      default:
        throw new Error(`Unexpected MCP method: ${rpc.method}`);
    }
    return Response.json({ jsonrpc: "2.0", id: rpc.id, result });
  });
}

describe("full chat web research", () => {
  beforeEach(() => {
    vi.stubEnv("CIAO_WEB_SEARCH", "");
    vi.stubEnv("PARALLEL_API_KEY", "ambient-key-must-not-be-used");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("dispatches anonymous search and fetch and consumes sources in the next model step", async () => {
    const http = mcpFixture();
    vi.stubGlobal("fetch", http);
    const model = scriptedModel([
      { name: "searchWeb", args: { query: QUERY } },
      { name: "fetchWebPage", args: { urls: [SOURCE] } },
    ], (prompt) => {
      expect(prompt).toContain(SOURCE);
      expect(prompt).toContain("Research source excerpt.");
      return `Research source: ${SOURCE}`;
    });
    const response = await runChatTurn(input(model));
    expect(await response.text()).toContain(`Research source: ${SOURCE}`);
    expect(model.doStreamCalls).toHaveLength(3);
    const requests = http.mock.calls.filter(([, init]) => init?.body).map(([, init]) => JSON.parse(String(init?.body)) as Rpc);
    expect(requests.filter((rpc) => rpc.method === "initialize")).toHaveLength(2);
    expect(requests.filter((rpc) => rpc.method === "tools/list")).toHaveLength(2);
    const calls = requests.filter((rpc) => rpc.method === "tools/call");
    expect(calls.map((rpc) => rpc.params?.name)).toEqual(["web_search", "web_fetch"]);
    expect(calls[0]?.params?.arguments).toEqual({ objective: QUERY, search_queries: [QUERY], session_id: expect.stringMatching(/^[a-f0-9]{64}$/) });
    expect(calls[1]?.params?.arguments).toEqual({ urls: [SOURCE], session_id: calls[0]?.params?.arguments?.session_id });
    expect(JSON.stringify(requests)).not.toContain("private-user-id");
    expect(JSON.stringify(requests)).not.toContain("surveyContext");
  });

  it.each([
    { deployment: "off", requested: true },
    { deployment: "on", requested: false },
  ])("honors disabled web research: $deployment/$requested", async ({ deployment, requested }) => {
    vi.stubEnv("CIAO_WEB_SEARCH", deployment);
    const http = mcpFixture();
    vi.stubGlobal("fetch", http);
    const model = scriptedModel([]);
    await (await runChatTurn(input(model, { webSearch: requested }))).text();
    const names = model.doStreamCalls[0]?.tools?.map((definition) => definition.name);
    expect(names).not.toContain("searchWeb");
    expect(names).not.toContain("fetchWebPage");
    expect(names).toContain("recallSurveyDetail");
    expect(model.doStreamCalls[0]?.prompt[0]).not.toMatchObject({ content: expect.stringContaining("Web research tools") });
    expect(http).not.toHaveBeenCalled();
  });

  it("registers web tools lazily and preserves configured docs search", async () => {
    const http = mcpFixture();
    vi.stubGlobal("fetch", http);
    const model = scriptedModel([]);
    await (await runChatTurn(input(model, { ragSearch: { googleApiKey: "configured-google", sql: {} as never } }))).text();
    expect(model.doStreamCalls[0]?.tools?.map((definition) => definition.name)).toEqual(expect.arrayContaining(["searchWeb", "fetchWebPage", "searchDocs", "recallSurveyDetail", "compareDimensions"]));
    expect(http).not.toHaveBeenCalled();
  });

  it("reuses the quota identifier on later turns of a saved thread", async () => {
    const http = mcpFixture();
    vi.stubGlobal("fetch", http);
    const repository = createMemoryChatRepository();
    const first = await runChatTurn(input(scriptedModel([{ name: "searchWeb", args: { query: QUERY } }]), { repository, temporary: false }));
    await first.text();
    const threadId = first.headers.get("x-chat-thread-id");
    expect(threadId).toBeTruthy();
    await (await runChatTurn(input(scriptedModel([{ name: "searchWeb", args: { query: "personality meta analysis" } }]), { repository, threadId, temporary: false }))).text();
    const ids = http.mock.calls.filter(([, init]) => init?.body)
      .map(([, init]) => JSON.parse(String(init?.body)) as Rpc)
      .filter((rpc) => rpc.method === "tools/call")
      .map((rpc) => rpc.params?.arguments?.session_id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
  });

  it("bounds oversized excerpts and removes duplicate MCP content before model consumption", async () => {
    const large = { results: [{ url: SOURCE, title: "Research", excerpts: ["Evidence. ".repeat(40_000)] }] };
    const http = mcpFixture(() => ({ content: [{ type: "text", text: JSON.stringify(large) }], structuredContent: large }));
    vi.stubGlobal("fetch", http);
    const model = scriptedModel([{ name: "fetchWebPage", args: { urls: [SOURCE] } }], (prompt) => {
      expect(prompt).toContain(SOURCE);
      expect(prompt).toContain("Evidence.");
      expect(prompt).toContain('truncated');
      expect(prompt.length).toBeLessThan(30_000);
      return "A bounded research excerpt was received.";
    });
    expect(await (await runChatTurn(input(model))).text()).toContain("A bounded research excerpt");
  });

  it.each(["javascript:alert(1)", "file:///etc/passwd", "https://user:secret@example.org/"])("rejects unsafe fetch URL %s before connecting", async (url) => {
    const http = mcpFixture();
    vi.stubGlobal("fetch", http);
    const model = scriptedModel([{ name: "fetchWebPage", args: { urls: [url] } }]);
    const output = await (await runChatTurn(input(model))).text();
    expect(output).toContain("tool-output-error");
    expect(http).not.toHaveBeenCalled();
  });

  it.each(["tool-error", "http-error", "invalid-json"])("passes %s to the loop without retry or provider fallback", async (failure) => {
    const fixture = mcpFixture(() => ({ isError: true, content: [{ type: "text", text: "Service unavailable" }] }));
    const http = vi.fn(async (...args: Parameters<typeof fetch>) => {
      if (!args[1]?.body) return fixture(...args);
      const rpc = JSON.parse(String(args[1]?.body)) as Rpc;
      if (rpc.method === "tools/call" && failure !== "tool-error") {
        return failure === "http-error" ? new Response("Unavailable", { status: 503 }) : new Response("invalid", { headers: { "Content-Type": "application/json" } });
      }
      return fixture(...args);
    });
    vi.stubGlobal("fetch", http);
    const model = scriptedModel([{ name: "searchWeb", args: { query: QUERY } }], (prompt) => {
      expect(prompt).toContain("Web research is unavailable");
      return "Research is unavailable.";
    });
    expect(await (await runChatTurn(input(model))).text()).toContain("Research is unavailable.");
    expect(http.mock.calls.filter(([, init]) => init?.body && JSON.parse(String(init.body)).method === "tools/call")).toHaveLength(1);
  });

  it("applies the web deadline to a pending HTTP request", async () => {
    const deadline = new AbortController();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
    const http = mcpFixture((_rpc, signal) => new Promise((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
      deadline.abort(new DOMException("Web deadline reached", "TimeoutError"));
    }));
    vi.stubGlobal("fetch", http);
    const model = scriptedModel([{ name: "searchWeb", args: { query: QUERY } }]);
    const output = await (await runChatTurn(input(model))).text();
    expect(timeout).toHaveBeenCalledWith(12_000);
    expect(output).toContain("tool-output-error");
  });

  it("cancels in-flight research when the chat request is aborted", async () => {
    const request = new AbortController();
    let observedSignal: AbortSignal | null | undefined;
    const http = mcpFixture((_rpc, signal) => new Promise((_resolve, reject) => {
      observedSignal = signal;
      signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
      request.abort();
    }));
    vi.stubGlobal("fetch", http);
    const model = scriptedModel([{ name: "searchWeb", args: { query: QUERY } }]);
    await (await runChatTurn(input(model, { abortSignal: request.signal }))).text();
    expect(observedSignal?.aborted).toBe(true);
    expect(model.doStreamCalls).toHaveLength(1);
  });

  it.runIf(process.env.CIAO_LIVE_WEB_RESEARCH === "1")("exercises the anonymous live MCP through the chat loop (scripted model)", async () => {
    const networkFetch = globalThis.fetch;
    const observed: {
      method?: string; status: number; body: string; at: string;
      retryAfter: string | null; url: string; userAgent: string | null;
    }[] = [];
    vi.stubGlobal("fetch", async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe("https://search.parallel.ai/mcp");
      expect(new Headers(init?.headers).get("user-agent")).toContain("Ciao-Platform/0.1.0");
      expect(new Headers(init?.headers).has("authorization")).toBe(false);
      const method = init?.body ? (JSON.parse(String(init.body)) as Rpc).method : init?.method;
      const response = await networkFetch(url, init);
      const entry = {
        method, status: response.status, body: await response.clone().text(),
        at: new Date().toISOString(), retryAfter: response.headers.get("retry-after"),
        url: String(url), userAgent: new Headers(init?.headers).get("user-agent"),
      };
      observed.push(entry);
      return response;
    });
    const model = scriptedModel([
      { name: "searchWeb", args: { query: "Big Five personality research review" } },
      { name: "fetchWebPage", args: { urls: ["https://en.wikipedia.org/wiki/Big_Five_personality_traits"] } },
    ], (prompt) => {
      expect(prompt).toContain("tool");
      return "Live research tool responses received.";
    });
    await (await runChatTurn(input(model))).text();
    if (process.env.CIAO_WEB_RESEARCH_EVIDENCE) {
      const { writeFile } = await import("node:fs/promises");
      await writeFile(process.env.CIAO_WEB_RESEARCH_EVIDENCE, JSON.stringify({
        scriptedModel: true, observed, finalPrompt: model.doStreamCalls.at(-1)?.prompt,
      }, null, 2));
    }
    expect(model.doStreamCalls).toHaveLength(3);
    const responses = observed.filter((entry) => entry.method === "tools/call");
    expect(responses).toHaveLength(2);
    for (const entry of responses) {
      // A free anonymous quota is an expected condition, never a live success.
      const quota = /quota|rate.limit|usage.limit/i.test(entry.body);
      expect(entry.status === 200 || quota).toBe(true);
      if (quota) console.info("LIVE_MCP_QUOTA", "Anonymous quota response retained; this is not a successful live search.");
      else {
        expect(entry.body).not.toMatch(/"isError"\s*:\s*true/);
        expect(entry.body).toMatch(/https?:/);
        const toolResults = model.doStreamCalls.at(-1)?.prompt.filter((message) => message.role === "tool");
        expect(JSON.stringify(toolResults)).toMatch(/https?:/);
      }
    }
  });
});
