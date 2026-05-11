import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserId = vi.fn();
const loadSurveyChatContext = vi.fn();

vi.mock("@ciaobang/auth", () => ({
  getCurrentUserId,
}));

vi.mock("@/lib/chat-context-loader", () => ({
  loadSurveyChatContext,
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

function sign(userId: string) {
  return createHmac("sha256", "test-context-secret").update(userId).digest("hex");
}

describe("GET /api/internal/survey-context", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    getCurrentUserId.mockReset();
    loadSurveyChatContext.mockReset();
    process.env = {
      ...originalEnv,
      SURVEY_CONTEXT_SECRET: "test-context-secret",
    };
    getCurrentUserId.mockResolvedValue(null);
    loadSurveyChatContext.mockResolvedValue(surveyContext);
  });

  it("loads survey context from a signed internal user id without requiring cookies", async () => {
    const { GET } = await import("@/app/api/internal/survey-context/route");

    const response = await GET(
      new Request("https://survey.example/api/internal/survey-context", {
        headers: {
          "x-ciao-user-id": "user_123",
          "x-ciao-signature": sign("user_123"),
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ context: surveyContext });
    expect(getCurrentUserId).not.toHaveBeenCalled();
    expect(loadSurveyChatContext).toHaveBeenCalledWith("user_123");
  });

  it("rejects an invalid internal signature when no cookie auth is available", async () => {
    const { GET } = await import("@/app/api/internal/survey-context/route");

    const response = await GET(
      new Request("https://survey.example/api/internal/survey-context", {
        headers: {
          "x-ciao-user-id": "user_123",
          "x-ciao-signature": sign("other_user"),
        },
      }),
    );

    expect(response.status).toBe(401);
    expect(loadSurveyChatContext).not.toHaveBeenCalled();
  });
});
