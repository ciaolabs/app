import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

const surveyContext = {
  personality: {
    submittedAt: "2026-05-03T06:42:00.000Z",
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

describe("loadSurveyChatContext", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SURVEY_URL: "https://survey.example",
      SURVEY_CONTEXT_SECRET: "test-context-secret",
    };
    vi.restoreAllMocks();
  });

  it("sends the authenticated user id with a signed internal survey context request", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        context: surveyContext,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { loadSurveyChatContext } = await import("@/lib/chat/survey-context.server");
    const context = await loadSurveyChatContext({ userId: "user_123" });

    expect(context).toEqual(surveyContext);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://survey.example/api/internal/survey-context",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
      }),
    );

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get("x-ciao-user-id")).toBe("user_123");
    expect(headers.get("x-ciao-signature")).toBe(
      createHmac("sha256", "test-context-secret").update("user_123").digest("hex"),
    );
  });
});
