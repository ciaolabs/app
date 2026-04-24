import { describe, expect, it } from "vitest";

import { personalitySurveyDefinition } from "@/lib/survey/definitions";
import { surveyQuestions } from "@/lib/survey/questions";
import { buildSurveyResults } from "@/lib/survey/results/engine";
import type { SurveyAnswers, SurveySubmission } from "@/lib/survey/types";

function makeAnswers(value: SurveyAnswers[string]) {
  return Object.fromEntries(surveyQuestions.map((question) => [question.id, value] as const)) as SurveyAnswers;
}

function makeSubmission(answers: SurveyAnswers): SurveySubmission {
  const now = new Date().toISOString();

  return {
    submissionId: "submission_1",
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

function findScale(results: ReturnType<typeof buildSurveyResults>, scaleNo: number) {
  for (const framework of results.frameworks) {
    for (const section of framework.sections) {
      const match = section.items.find((item) => item.scaleNo === scaleNo);

      if (match) {
        return match;
      }
    }
  }

  throw new Error(`Scale ${scaleNo} not found in results.`);
}

describe("buildSurveyResults", () => {
  it("scores reverse-coded scales in the expected direction", () => {
    const highAnswers = makeAnswers(1);
    const lowAnswers = makeAnswers(6);
    const highResults = buildSurveyResults(makeSubmission(highAnswers));
    const lowResults = buildSurveyResults(makeSubmission(lowAnswers));
    const greedAvoidanceHigh = findScale(highResults, 33);
    const greedAvoidanceLow = findScale(lowResults, 33);

    expect(greedAvoidanceHigh.displayName).toBe("Greed Avoidance");
    expect(greedAvoidanceHigh.score).toBe(50);
    expect(greedAvoidanceHigh.band).toBe("High");
    expect(greedAvoidanceLow.score).toBe(0);
    expect(greedAvoidanceLow.band).toBe("Low");
  });

  it("builds the eight frameworks, calibrated overview cards, and ordered rankings", () => {
    const results = buildSurveyResults(makeSubmission(makeAnswers(4)));
    const neo = results.frameworks.find((framework) => framework.id === "NEO");
    const hexaco = results.frameworks.find((framework) => framework.id === "HEXACO");

    expect(results.frameworks).toHaveLength(8);
    expect(neo?.overview).toHaveLength(5);
    expect(hexaco?.overview).toHaveLength(6);
    expect(results.ranked.highestByScore[0].score).toBeGreaterThanOrEqual(
      results.ranked.highestByScore[1].score,
    );
    expect(results.ranked.lowestByPercentile[0].percentile).toBeLessThanOrEqual(
      results.ranked.lowestByPercentile[1].percentile,
    );
  });

  it("emits percentile copy for both higher and lower-than outcomes", () => {
    const higherResults = buildSurveyResults(makeSubmission(makeAnswers(1)));
    const lowerResults = buildSurveyResults(makeSubmission(makeAnswers(6)));
    const higherScale = findScale(higherResults, 33);
    const lowerScale = findScale(lowerResults, 33);

    expect(higherScale.percentileText).toMatch(/Higher than \d+% of people/);
    expect(lowerScale.percentileText).toMatch(/Lower than \d+% of people/);
    expect(higherScale.percentile).toBeGreaterThanOrEqual(1);
    expect(lowerScale.percentile).toBeLessThanOrEqual(99);
  });
});
