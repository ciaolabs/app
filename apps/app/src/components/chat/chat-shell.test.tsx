import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatShell } from "@/components/chat/chat-shell";

const defaultProviders = { anthropic: true, google: true };

describe("ChatShell", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 401 })));
  });

  it("offers survey completion links alongside generic prompts when no survey context exists", () => {
    render(
      <ChatShell
        initialThreads={[]}
        surveyContext={{ personality: null, valuesBeliefs: null }}
        apiKeyProviders={defaultProviders}
        initialChatModel="gemini-flash-lite-latest"
      />,
    );

    expect(screen.getByRole("heading", { name: "How can I help you?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Take Personality survey" })).toHaveAttribute(
      "href",
      "https://survey.ciaobang.com/surveys/personality",
    );
    expect(screen.getByRole("link", { name: "Take Values and Beliefs survey" })).toHaveAttribute(
      "href",
      "https://survey.ciaobang.com/surveys/values-beliefs",
    );
  });

  it("hides survey completion CTAs once saved survey context loads from the browser refresh", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          context: {
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
          },
        }),
      ),
    );

    render(
      <ChatShell
        initialThreads={[]}
        surveyContext={{ personality: null, valuesBeliefs: null }}
        apiKeyProviders={defaultProviders}
        initialChatModel="gemini-flash-lite-latest"
      />,
    );

    expect(screen.getByRole("link", { name: "Take Personality survey" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "How can I help you?" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Take Personality survey" })).not.toBeInTheDocument();
  });
});
