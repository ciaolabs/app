import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatShell } from "@/components/chat/chat-shell";

describe("ChatShell", () => {
  it("shows survey completion links when no survey context exists", () => {
    render(
      <ChatShell
        initialThreads={[]}
        surveyContext={{ personality: null, valuesBeliefs: null }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Complete a survey to start" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Take Personality" })).toHaveAttribute(
      "href",
      "/surveys/personality",
    );
    expect(screen.getByRole("link", { name: "Take Values and Beliefs" })).toHaveAttribute(
      "href",
      "/surveys/values-beliefs",
    );
  });
});
