import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { formatSubmittedAt } from "@/lib/date-format";
import { personalitySurveyDefinition } from "@/lib/survey/definitions";
import { surveyQuestions } from "@/lib/survey/questions";
import { buildSurveyResults } from "@/lib/survey/results/engine";
import { SURVEYS_ROUTE } from "@/lib/survey/routes";
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
    surveyType: personalitySurveyDefinition.type,
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
    surveyType: submission.surveyType,
    answerCount: submission.answerCount,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    submittedAt: submission.submittedAt,
  };
}

describe("DashboardShell", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
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
    fetchMock = vi.fn(async (input: string | URL | Request) => {
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
      });
    vi.stubGlobal("fetch", fetchMock as typeof fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    (globalThis as { __clerkTestSignedIn?: boolean }).__clerkTestSignedIn = false;
  });

  it("renders the tabbed framework dashboard from the composed results payload", async () => {
    render(
      React.createElement(DashboardShell, {
        survey: personalitySurveyDefinition,
        initialPayload: {
          results: latestResults,
          submissions,
          selectedSubmissionId: latestResults.submission.submissionId,
        },
      }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Surveys" })).toHaveAttribute("href", SURVEYS_ROUTE);
    expect(screen.getByRole("link", { name: "Measures of Your Personality" })).toHaveAttribute(
      "href",
      "/surveys/personality",
    );
    expect(screen.getByRole("link", { name: "New Surveys" })).toHaveAttribute("href", SURVEYS_ROUTE);
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
    render(
      React.createElement(DashboardShell, {
        survey: personalitySurveyDefinition,
        initialPayload: {
          results: latestResults,
          submissions,
          selectedSubmissionId: latestResults.submission.submissionId,
        },
      }),
    );

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
    render(
      React.createElement(DashboardShell, {
        survey: personalitySurveyDefinition,
        initialPayload: {
          results: latestResults,
          submissions,
          selectedSubmissionId: latestResults.submission.submissionId,
        },
      }),
    );

    const earlierDateLabel = formatSubmittedAt(earlierSubmission.submittedAt);

    await user.click(screen.getByRole("button", { name: new RegExp(earlierDateLabel, "i") }));

    await waitFor(() => {
      expect(screen.getAllByText(earlierDateLabel).length).toBeGreaterThan(0);
      expect(screen.getByText("Viewing saved results")).toBeInTheDocument();
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = new Headers(requestInit?.headers);
    expect(headers.has("Authorization")).toBe(false);
    expect(requestInit?.credentials).toBe("include");
  });

  it("does not surface raw authentication text in the dashboard error state", async () => {
    render(
      React.createElement(DashboardShell, {
        survey: personalitySurveyDefinition,
        initialPayload: {
          error: "Authentication required.",
          results: null,
          submissions: [],
          selectedSubmissionId: null,
        },
      }),
    );

    expect(screen.getByText("Please refresh the page and try again.")).toBeInTheDocument();
    expect(screen.queryByText("Authentication required.")).not.toBeInTheDocument();
  });
});
