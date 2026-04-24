import { describe, expect, it } from "vitest";

import { getSurveyQuestions } from "@/lib/survey/questions";
import { buildSurveyResults } from "@/lib/survey/results/engine";
import type { SurveyAnswers, SurveySubmission } from "@/lib/survey/types";

function makeAnswers(defaultValue: SurveyAnswers[string]) {
  return Object.fromEntries(
    getSurveyQuestions("values-beliefs").map((question) => [question.id, defaultValue] as const),
  ) as SurveyAnswers;
}

function makeSubmission(answers: SurveyAnswers): SurveySubmission {
  const now = new Date().toISOString();

  return {
    submissionId: "values_submission_1",
    userId: "user_123",
    surveyType: "values-beliefs",
    status: "submitted",
    answerCount: getSurveyQuestions("values-beliefs").length,
    answers,
    createdAt: now,
    updatedAt: now,
    submittedAt: now,
  };
}

function findBelief(results: ReturnType<typeof buildSurveyResults>, id: string) {
  if (results.surveyType !== "values-beliefs") {
    throw new Error("Expected values-beliefs results.");
  }

  const allBeliefs = [
    results.beliefs.primary,
    ...results.beliefs.secondary,
    ...results.beliefs.tertiaryGroups.flatMap((group) => group.items),
    ...results.beliefs.neutralPrimals,
  ];
  const match = allBeliefs.find((item) => item.id === id);

  if (!match) {
    throw new Error(`Belief ${id} not found.`);
  }

  return match;
}

function findValue(results: ReturnType<typeof buildSurveyResults>, id: string) {
  if (results.surveyType !== "values-beliefs") {
    throw new Error("Expected values-beliefs results.");
  }

  const allValues = [
    ...results.values.higherOrder,
    ...results.values.groups.flatMap((group) => group.items),
    ...results.values.otherValues,
  ];
  const match = allValues.find((item) => item.id === id);

  if (!match) {
    throw new Error(`Value ${id} not found.`);
  }

  return match;
}

describe("buildValuesBeliefsResults", () => {
  it("scores reverse-coded primal items in the expected direction", () => {
    const highAnswers = makeAnswers(3);
    highAnswers.PWB85 = 1;
    highAnswers.PWB86 = 1;
    highAnswers.PWB87 = 1;
    highAnswers.PWB88 = 6;

    const lowAnswers = makeAnswers(3);
    lowAnswers.PWB85 = 6;
    lowAnswers.PWB86 = 6;
    lowAnswers.PWB87 = 6;
    lowAnswers.PWB88 = 1;

    const highResults = buildSurveyResults(makeSubmission(highAnswers));
    const lowResults = buildSurveyResults(makeSubmission(lowAnswers));
    const stableHigh = findBelief(highResults, "stable");
    const stableLow = findBelief(lowResults, "stable");

    expect(stableHigh.highLabel).toBe("Stable");
    expect(stableHigh.score).toBe(50);
    expect(stableLow.score).toBe(0);
  });

  it("scores PVQ-RR value groups and keeps the tabbed result structure", () => {
    const answers = makeAnswers(3);
    answers.PVQ06 = 6;
    answers.PVQ29 = 6;
    answers.PVQ41 = 6;

    const results = buildSurveyResults(makeSubmission(answers));

    expect(results.surveyType).toBe("values-beliefs");
    if (results.surveyType !== "values-beliefs") {
      throw new Error("Expected values-beliefs results.");
    }

    expect(results.beliefs.overview).toHaveLength(4);
    expect(results.beliefs.tertiaryGroups).toHaveLength(3);
    expect(results.values.higherOrder).toHaveLength(4);
    expect(results.values.groups).toHaveLength(4);
    expect(results.values.otherValues).toHaveLength(2);
    expect(findValue(results, "power-dominance").score).toBeGreaterThan(25);
  });

  it("emits percentile-style text for both beliefs and values", () => {
    const results = buildSurveyResults(makeSubmission(makeAnswers(4)));

    expect(results.surveyType).toBe("values-beliefs");
    if (results.surveyType !== "values-beliefs") {
      throw new Error("Expected values-beliefs results.");
    }

    expect(results.beliefs.primary.percentileText).toMatch(
      /(Higher|Lower) than \d+% of reference respondents/,
    );
    expect(results.values.higherOrder[0]?.percentileText).toMatch(
      /(Higher|Lower) than \d+% of reference respondents/,
    );
  });
});
