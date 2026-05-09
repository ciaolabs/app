import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatShell } from "@/components/chat/chat-shell";

describe("ChatShell", () => {
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
});
