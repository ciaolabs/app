import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ValuesBeliefsDashboardShell } from "@/components/dashboard/values-beliefs-dashboard-shell";
import { formatSubmittedAt } from "@/lib/date-format";
import { getPendingResultsKey, valuesBeliefsSurveyDefinition } from "@/lib/survey/definitions";
import { getSurveyQuestions } from "@/lib/survey/questions";
import { buildSurveyResults } from "@/lib/survey/results/engine";
import { SURVEYS_ROUTE } from "@/lib/survey/routes";
import type { SurveyAnswers, SurveySubmission, SurveySubmissionSummary } from "@/lib/survey/types";

function expectInOrder(labels: string[]) {
  const headings = labels.map((label) => screen.getByRole("heading", { name: label }));

  for (let index = 0; index < headings.length - 1; index += 1) {
    expect(
      headings[index]?.compareDocumentPosition(headings[index + 1]!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  }
}

function makeAnswers(value: SurveyAnswers[string]) {
  return Object.fromEntries(
    getSurveyQuestions("values-beliefs").map((question) => [question.id, value] as const),
  ) as SurveyAnswers;
}

function makeSubmission(
  answers: SurveyAnswers,
  submissionId: string,
  submittedAt: string,
): SurveySubmission & { surveyType: "values-beliefs" } {
  return {
    submissionId,
    userId: "user_123",
    surveyType: "values-beliefs",
    status: "submitted",
    answerCount: getSurveyQuestions("values-beliefs").length,
    answers,
    createdAt: submittedAt,
    updatedAt: submittedAt,
    submittedAt,
  };
}

function toSummary(submission: SurveySubmission): SurveySubmissionSummary {
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

describe("ValuesBeliefsDashboardShell", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const earlierSubmission = makeSubmission(
    makeAnswers(4),
    "values_submission_1",
    "2026-04-07T08:00:00.000Z",
  );
  const latestSubmission = makeSubmission(
    makeAnswers(5),
    "values_submission_2",
    "2026-04-08T09:30:00.000Z",
  );
  const earlierResults = buildSurveyResults(earlierSubmission);
  const latestResults = buildSurveyResults(latestSubmission);
  const submissions = [toSummary(latestSubmission), toSummary(earlierSubmission)];

  beforeEach(() => {
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
    window.sessionStorage.clear();
  });

  it("renders the tabbed beliefs and values dashboard and switches tabs", async () => {
    const user = userEvent.setup();
    if (latestResults.surveyType !== "values-beliefs") {
      throw new Error("Expected values-beliefs results.");
    }

    render(
      React.createElement(ValuesBeliefsDashboardShell, {
        survey: valuesBeliefsSurveyDefinition,
        initialPayload: {
          results: latestResults,
          submissions,
          selectedSubmissionId: latestResults.submission.submissionId,
        },
      }),
    );

    expect(screen.getByRole("link", { name: "Surveys" })).toHaveAttribute("href", SURVEYS_ROUTE);
    expect(screen.getByRole("link", { name: "Start a survey →" })).toHaveAttribute(
      "href",
      SURVEYS_ROUTE,
    );
    expect(screen.getByRole("button", { name: "beliefs" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "values" })).toBeInTheDocument();
    expect(screen.getByLabelText("Beliefs level summary violin")).toBeInTheDocument();
    expect(screen.getByText("Neutral Primals")).toBeInTheDocument();
    expectInOrder([
      "Belief that the World is Good vs. Bad",
      "Enticing vs. Dull",
      "Safe vs. Dangerous",
      "Alive vs. Mechanistic",
      "Neutral Primals",
    ]);

    await user.click(screen.getByRole("button", { name: "values" }));

    await waitFor(() => {
      expect(screen.queryByLabelText("Beliefs level summary violin")).not.toBeInTheDocument();
      expect(screen.getByText("Other values")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Openness to Change" })).toBeInTheDocument();
      expectInOrder([
        "Openness to Change",
        "Self-Transcendence",
        "Conservation",
        "Self-Enhancement",
        "Other values",
      ]);
    });
  });

  it("loads an older saved submission from the history list", async () => {
    const user = userEvent.setup();
    if (latestResults.surveyType !== "values-beliefs") {
      throw new Error("Expected values-beliefs results.");
    }

    render(
      React.createElement(ValuesBeliefsDashboardShell, {
        survey: valuesBeliefsSurveyDefinition,
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
    });
  });

  it("recovers from a stale empty dashboard payload by fetching the latest results", async () => {
    if (latestResults.surveyType !== "values-beliefs") {
      throw new Error("Expected values-beliefs results.");
    }

    render(
      React.createElement(ValuesBeliefsDashboardShell, {
        survey: valuesBeliefsSurveyDefinition,
        initialPayload: {
          results: null,
          submissions: [],
          selectedSubmissionId: null,
        },
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Viewing saved results")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/surveys/values-beliefs/results",
      expect.objectContaining({
        cache: "no-store",
        credentials: "include",
      }),
    );
    expect(screen.getAllByText(formatSubmittedAt(latestSubmission.submittedAt)).length).toBeGreaterThan(0);
  });

  it("refreshes stale initial results after a pending submission", async () => {
    if (earlierResults.surveyType !== "values-beliefs" || latestResults.surveyType !== "values-beliefs") {
      throw new Error("Expected values-beliefs results.");
    }

    window.sessionStorage.setItem(
      getPendingResultsKey(valuesBeliefsSurveyDefinition.type),
      latestSubmission.submittedAt,
    );

    render(
      React.createElement(ValuesBeliefsDashboardShell, {
        survey: valuesBeliefsSurveyDefinition,
        initialPayload: {
          results: earlierResults,
          submissions: [toSummary(earlierSubmission)],
          selectedSubmissionId: earlierResults.submission.submissionId,
        },
      }),
    );

    await waitFor(() => {
      expect(screen.getAllByText(formatSubmittedAt(latestSubmission.submittedAt)).length).toBeGreaterThan(0);
    });

    expect(window.sessionStorage.getItem(getPendingResultsKey(valuesBeliefsSurveyDefinition.type))).toBeNull();
  });

  it("shows the empty state when no results are available", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: null,
          submissions: [],
          selectedSubmissionId: null,
        }),
      ),
    );

    render(
      React.createElement(ValuesBeliefsDashboardShell, {
        survey: valuesBeliefsSurveyDefinition,
        initialPayload: {
          results: null,
          submissions: [],
          selectedSubmissionId: null,
        },
      }),
    );

    expect(
      screen.getByText("Your results dashboard appears after you submit the survey."),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/surveys/values-beliefs/results",
        expect.objectContaining({
          cache: "no-store",
          credentials: "include",
        }),
      );
    });
  });

  it("clears pending-results markers after a refresh even when results are null", async () => {
    const pendingResultsKey = getPendingResultsKey(valuesBeliefsSurveyDefinition.type);
    window.sessionStorage.setItem(pendingResultsKey, new Date().toISOString());
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: null,
          submissions: [],
          selectedSubmissionId: null,
        }),
      ),
    );

    render(
      React.createElement(ValuesBeliefsDashboardShell, {
        survey: valuesBeliefsSurveyDefinition,
        initialPayload: {
          results: null,
          submissions: [],
          selectedSubmissionId: null,
        },
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(window.sessionStorage.getItem(pendingResultsKey)).toBeNull();
    const goToSurveyLinks = screen.getAllByRole("link", { name: "Start a survey →" });
    expect(goToSurveyLinks.length).toBeGreaterThan(0);
    goToSurveyLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", SURVEYS_ROUTE);
    });
  });
});
