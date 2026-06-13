import { describe, expect, it } from "vitest";
import { buildAssistBody } from "./assist-request";

describe("buildAssistBody", () => {
  it("includes pageContent when a docs page provides it", () => {
    const body = buildAssistBody({
      model: "claude-haiku-4-5",
      provider: "anthropic",
      pageContent: "# Beliefs\n\nSome documentation text.",
    });

    expect(body).toEqual({
      model: "claude-haiku-4-5",
      provider: "anthropic",
      pageContent: "# Beliefs\n\nSome documentation text.",
    });
  });

  it("omits pageContent in the survey section (none provided)", () => {
    expect(
      buildAssistBody({ model: "claude-haiku-4-5", provider: "anthropic" }),
    ).toEqual({ model: "claude-haiku-4-5", provider: "anthropic" });
  });

  it("omits blank pageContent rather than sending empty context", () => {
    expect(
      buildAssistBody({ model: "m", provider: "p", pageContent: "   \n  " }),
    ).toEqual({ model: "m", provider: "p" });
  });
});
