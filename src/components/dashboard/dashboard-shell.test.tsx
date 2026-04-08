import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { surveyQuestions } from "@/lib/survey/questions";
import { buildSurveyResults } from "@/lib/survey/results/engine";
import type { SurveyAnswers, SurveySubmission, SurveySubmissionSummary } from "@/lib/survey/types";

function makeAnswers(value: SurveyAnswers[string]) {
  return Object.fromEntries(surveyQuestions.map((question) => [question.id, value] as const)) as SurveyAnswers;
}

function makeSubmission(
  answers: SurveyAnswers,
  submissionId: string,
  submittedAt: string,
): SurveySubmission {
  const now = submittedAt;

  return {
    submissionId,
    userId: "user_123",
    status: "submitted",
    answerCount: surveyQuestions.length,
    answers,
    createdAt: now,
    updatedAt: now,
    submittedAt: now,
  };
}

function toSubmissionSummary(submission: SurveySubmission): SurveySubmissionSummary {
  return {
    submissionId: submission.submissionId,
    userId: submission.userId,
    answerCount: submission.answerCount,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    submittedAt: submission.submittedAt,
  };
}

describe("DashboardShell", () => {
  const earlierSubmission = makeSubmission(
    makeAnswers(4),
    "submission_1",
    "2026-04-07T08:00:00.000Z",
  );
  const latestSubmission = makeSubmission(
    makeAnswers(5),
    "submission_2",
    "2026-04-08T09:30:00.000Z",
  );
  const earlierResults = buildSurveyResults(earlierSubmission);
  const latestResults = buildSurveyResults(latestSubmission);
  const submissions = [toSubmissionSummary(latestSubmission), toSubmissionSummary(earlierSubmission)];

  beforeEach(() => {
    (globalThis as { __clerkTestSignedIn?: boolean }).__clerkTestSignedIn = true;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const href =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        const url = new URL(href, "http://localhost");
        const selectedSubmissionId = url.searchParams.get("submissionId");
        const results =
          selectedSubmissionId === earlierSubmission.submissionId ? earlierResults : latestResults;

        return new Response(
          JSON.stringify({
            results,
            submissions,
            selectedSubmissionId: results.submission.submissionId,
          }),
        );
      }) as typeof fetch,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    (globalThis as { __clerkTestSignedIn?: boolean }).__clerkTestSignedIn = false;
  });

  it("renders the tabbed framework dashboard from the composed results payload", async () => {
    render(React.createElement(DashboardShell));

    await screen.findByText("200+ Measures of Your Personality");

    expect(screen.getByRole("link", { name: "Measures of Your Personality" })).toHaveAttribute(
      "href",
      "/personalitysurvey",
    );
    expect(screen.getAllByText("Survey Results").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "HEXACO" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "JPIR" })).toBeInTheDocument();
    expect(screen.getByText("Revised NEO Personality Inventory")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show more" })).toBeInTheDocument();
    expect(screen.getByText("Completed surveys")).toBeInTheDocument();
    expect(screen.getByText("2 saved")).toBeInTheDocument();
  });

  it("shows hover detail in the rankings area and switches frameworks", async () => {
    const user = userEvent.setup();
    render(React.createElement(DashboardShell));

    await screen.findByText("Your Scores");

    const topScale = latestResults.ranked.highestByScore[0];
    const rankingButtons = screen.getAllByRole("button", {
      name: new RegExp(topScale.displayName, "i"),
    });

    await user.hover(rankingButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText(topScale.displayName).length).toBeGreaterThan(1);
      expect(screen.getByText(topScale.description)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "HEXACO" }));

    await waitFor(() => {
      expect(screen.getByText("HEXACO Personality Inventory")).toBeInTheDocument();
    });
  });

  it("loads an older completed survey from the saved history list", async () => {
    const user = userEvent.setup();
    render(React.createElement(DashboardShell));

    await screen.findByText("Completed surveys");

    const earlierDateLabel = new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(earlierSubmission.submittedAt));

    await user.click(screen.getByRole("button", { name: new RegExp(earlierDateLabel, "i") }));

    await waitFor(() => {
      expect(screen.getAllByText(earlierDateLabel).length).toBeGreaterThan(0);
      expect(screen.getByText("Viewing saved results")).toBeInTheDocument();
    });
  });

  it("does not surface raw authentication text in the dashboard error state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: "Authentication required.",
              results: null,
              submissions: [],
              selectedSubmissionId: null,
            }),
            {
            status: 401,
            },
          ),
      ) as typeof fetch,
    );

    render(React.createElement(DashboardShell));

    await screen.findByText("We could not load the dashboard right now.");

    expect(screen.getByText("Please refresh the page and try again.")).toBeInTheDocument();
    expect(screen.queryByText("Authentication required.")).not.toBeInTheDocument();
  });
});
