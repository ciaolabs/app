import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ValuesBeliefsDashboardShell } from "@/components/dashboard/values-beliefs-dashboard-shell";
import { formatSubmittedAt } from "@/lib/date-format";
import { valuesBeliefsSurveyDefinition } from "@/lib/survey/definitions";
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
): SurveySubmission {
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

  it("shows the empty state when no results are available", () => {
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
  });
});
