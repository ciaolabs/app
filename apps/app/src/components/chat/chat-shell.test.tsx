import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatShell } from "@/components/chat/chat-shell";

describe("ChatShell", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 401 })));
  });

  it("shows survey completion links when no survey context exists", () => {
    render(
      <ChatShell
        initialThreads={[]}
        surveyContext={{ personality: null, valuesBeliefs: null }}
        hasApiKeys={true}
      />,
    );

    expect(screen.getByRole("heading", { name: "Complete a survey to start" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Take Personality survey" })).toHaveAttribute(
      "href",
      "https://survey.ciaobang.com/surveys/personality",
    );
    expect(screen.getByRole("link", { name: "Take Values and Beliefs survey" })).toHaveAttribute(
      "href",
      "https://survey.ciaobang.com/surveys/values-beliefs",
    );
  });

  it("recovers from an empty server context by refreshing saved survey context in the browser", async () => {
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
        hasApiKeys={true}
      />,
    );

    expect(screen.getByRole("heading", { name: "Complete a survey to start" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "How can I help you?" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Take Personality survey" })).not.toBeInTheDocument();
  });
});
