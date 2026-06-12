import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AssistPageContentProvider,
  SetAssistPageContent,
  useAssistPageContent,
} from "./assist-page-content";

function Probe() {
  const content = useAssistPageContent();
  return <span data-testid="content">{content ?? "<none>"}</span>;
}

describe("assist page content context", () => {
  it("publishes content set by a docs page to consumers (docs section)", () => {
    render(
      <AssistPageContentProvider>
        <SetAssistPageContent content="page body" />
        <Probe />
      </AssistPageContentProvider>,
    );

    expect(screen.getByTestId("content").textContent).toBe("page body");
  });

  it("defaults to undefined without a provider (survey section)", () => {
    render(<Probe />);

    expect(screen.getByTestId("content").textContent).toBe("<none>");
  });
});
