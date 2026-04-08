import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SurveyShell } from "@/components/survey/survey-shell";
import { SURVEY_RESULTS_ROUTE } from "@/lib/survey/routes";
import { QuestionItem, SurveyDraft } from "@/lib/survey/types";

const { navigateWithReload } = vi.hoisted(() => ({
  navigateWithReload: vi.fn(),
}));

vi.mock("@/lib/browser-navigation", () => ({
  navigateWithReload,
}));

const labels = [
  "Very inaccurate",
  "Moderately inaccurate",
  "Slightly inaccurate",
  "Slightly accurate",
  "Moderately accurate",
  "Very accurate",
] as const;

const questions: QuestionItem[] = [
  {
    id: "Q1",
    order: 1,
    prompt: "I rarely worry.",
    labels,
    seededDistribution: [10, 18, 24, 28, 16, 8],
  },
  {
    id: "Q2",
    order: 2,
    prompt: "I talk a lot.",
    labels,
    seededDistribution: [8, 12, 16, 26, 24, 14],
  },
  {
    id: "Q3",
    order: 3,
    prompt: "I am exacting in my work.",
    labels,
    seededDistribution: [6, 9, 15, 24, 26, 20],
  },
];

const initialDraft: SurveyDraft = {
  submissionId: "draft-1",
  userId: "user_1",
  status: "draft",
  answerCount: 0,
  answers: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  submittedAt: null,
};

describe("SurveyShell", () => {
  beforeEach(() => {
    vi.useRealTimers();
    (globalThis as { __clerkTestSignedIn?: boolean }).__clerkTestSignedIn = true;
    navigateWithReload.mockReset();
    vi.stubGlobal("fetch", vi.fn(async (input) => {
      if (typeof input === "string" && input.includes("/submit")) {
        return new Response(JSON.stringify({ submission: { submittedAt: new Date().toISOString() } }));
      }

      return new Response(JSON.stringify({ draft: initialDraft }));
    }) as typeof fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    (globalThis as { __clerkTestSignedIn?: boolean }).__clerkTestSignedIn = false;
    window.sessionStorage.clear();
  });

  it("supports keyboard answers and arrow navigation", async () => {
    const user = userEvent.setup();
    render(React.createElement(SurveyShell, { questions, initialDraft }));

    expect(screen.getByRole("button", { name: "Submit survey" })).toBeDisabled();

    await user.keyboard("4");

    expect(screen.getByText("Response pattern")).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 3/i)).toBeInTheDocument();

    await user.keyboard("{ArrowRight}5{ArrowRight}6");

    expect(screen.getByRole("button", { name: "Submit survey" })).toBeEnabled();
  });

  it("lets respondents jump back through the log and revise an earlier answer", async () => {
    const user = userEvent.setup();
    render(React.createElement(SurveyShell, { questions, initialDraft }));

    await user.click(screen.getByRole("button", { name: /Slightly accurate/i }));
    await user.click(screen.getByRole("button", { name: "Go to next question" }));
    await user.click(screen.getByRole("button", { name: /Moderately accurate/i }));
    await user.click(screen.getByRole("button", { name: /I rarely worry/i }));
    await user.click(screen.getByRole("button", { name: /Very inaccurate/i }));

    expect(screen.getAllByText("Very inaccurate").length).toBeGreaterThan(0);
  });

  it("moves between prompts with the arrow keys", async () => {
    const user = userEvent.setup();
    render(React.createElement(SurveyShell, { questions, initialDraft }));

    expect(screen.getByText(/Question 1 of 3/i)).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByText(/Question 2 of 3/i)).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText(/Question 1 of 3/i)).toBeInTheDocument();
  });

  it("keeps the active progress item in view during keyboard navigation", async () => {
    const user = userEvent.setup();
    const scrollIntoViewSpy = vi.spyOn(window.HTMLElement.prototype, "scrollIntoView");

    render(React.createElement(SurveyShell, { questions, initialDraft }));
    scrollIntoViewSpy.mockClear();

    await user.keyboard("{ArrowRight}{ArrowRight}");

    expect(screen.getByText(/Question 3 of 3/i)).toBeInTheDocument();
    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(2);
    expect(scrollIntoViewSpy).toHaveBeenLastCalledWith({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  });

  it("jumps to the first unanswered prompt from the progress rail", async () => {
    const user = userEvent.setup();
    render(React.createElement(SurveyShell, { questions, initialDraft }));

    await user.click(screen.getByRole("button", { name: /Slightly accurate/i }));
    await user.click(screen.getByRole("button", { name: "Go to next question" }));
    await user.click(screen.getByRole("button", { name: /Moderately accurate/i }));
    await user.click(screen.getByRole("button", { name: "Go to next question" }));

    expect(screen.getByText(/Question 3 of 3/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "First unanswered" }));

    expect(screen.getByText(/Question 3 of 3/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /I rarely worry/i }));
    await user.click(screen.getByRole("button", { name: "First unanswered" }));

    expect(screen.getByText(/Question 3 of 3/i)).toBeInTheDocument();
  });

  it("submits the completed survey and sends respondents to the dashboard", async () => {
    const user = userEvent.setup();
    render(React.createElement(SurveyShell, { questions, initialDraft }));

    await user.click(screen.getByRole("button", { name: /Slightly accurate/i }));
    await user.click(screen.getByRole("button", { name: "Go to next question" }));
    await user.click(screen.getByRole("button", { name: /Moderately accurate/i }));
    await user.click(screen.getByRole("button", { name: "Go to next question" }));
    await user.click(screen.getByRole("button", { name: /Very accurate/i }));
    await user.click(screen.getByRole("button", { name: "Submit survey" }));

    await waitFor(() => {
      expect(navigateWithReload).toHaveBeenCalledWith(SURVEY_RESULTS_ROUTE);
    });
  });

  it("returns to the dashboard immediately when a completed submission is pending results", async () => {
    window.sessionStorage.setItem("ambi-pending-results", new Date().toISOString());

    render(React.createElement(SurveyShell, { questions, initialDraft: null }));

    await waitFor(() => {
      expect(navigateWithReload).toHaveBeenCalledWith(SURVEY_RESULTS_ROUTE);
    });
  });
});
