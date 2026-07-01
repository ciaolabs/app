import { describe, expect, it } from "vitest";

import { surveyQuestions } from "@/lib/survey/questions";
import {
  buildSurveyResults,
  createReferenceDistributionSource,
  SEEDED_SOURCE,
} from "@/lib/survey/results/engine";
import {
  applyReferenceDistributions,
  SEEDED_DISTRIBUTION_SET,
  type QuestionDistributionMap,
  type ReferenceDistributionSet,
} from "@/lib/survey/results/reference-distributions";
import type { SurveyAnswers, SurveySubmission } from "@/lib/survey/types";

function makeAnswers(value: SurveyAnswers[string]) {
  return Object.fromEntries(
    surveyQuestions.map((question) => [question.id, value] as const),
  ) as SurveyAnswers;
}

function makeSubmission(answers: SurveyAnswers): SurveySubmission & { surveyType: "personality" } {
  const now = new Date().toISOString();
  return {
    submissionId: "submission_1",
    userId: "user_123",
    surveyType: "personality",
    status: "submitted",
    answerCount: surveyQuestions.length,
    answers,
    createdAt: now,
    updatedAt: now,
    submittedAt: now,
  };
}

function skewedSet(counts: number[], version: string): ReferenceDistributionSet {
  const distributions: QuestionDistributionMap = new Map(
    surveyQuestions.map((question) => [question.id, counts]),
  );
  return { version, distributions };
}

describe("createReferenceDistributionSource", () => {
  it("returns the seeded source when there are no distributions", () => {
    expect(createReferenceDistributionSource(SEEDED_DISTRIBUTION_SET)).toBe(SEEDED_SOURCE);
  });

  it("normalizes stored counts into probabilities", () => {
    const source = createReferenceDistributionSource(skewedSet([0, 0, 0, 0, 0, 10], "all-six"));
    const firstOrder = surveyQuestions[0].order;
    expect(source.probabilitiesFor(firstOrder)).toEqual([0, 0, 0, 0, 0, 1]);
  });

  it("falls back to the seeded distribution for questions absent from the set", () => {
    const [present, absent] = surveyQuestions;
    const distributions: QuestionDistributionMap = new Map([[present.id, [10, 0, 0, 0, 0, 0]]]);
    const source = createReferenceDistributionSource({ version: "partial", distributions });

    expect(source.probabilitiesFor(present.order)).toEqual([1, 0, 0, 0, 0, 0]);

    const fallback = source.probabilitiesFor(absent.order);
    expect(fallback).toHaveLength(6);
    expect(fallback.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 5);
    // The seeded distribution is not a single spike at rating 1.
    expect(fallback).not.toEqual([1, 0, 0, 0, 0, 0]);
  });
});

describe("buildSurveyResults with a reference distribution source", () => {
  it("keeps raw scores but moves reference-derived percentiles", () => {
    const submission = makeSubmission(makeAnswers(4));
    const seeded = buildSurveyResults(submission);
    const skewed = buildSurveyResults(
      submission,
      createReferenceDistributionSource(skewedSet([0, 0, 0, 0, 0, 10], "all-six")),
    );

    const seededScale = seeded.ranked.highestByScore.find((item) => item.scaleNo === 33)!;
    const skewedScale = skewed.ranked.highestByScore.find((item) => item.scaleNo === 33)!;

    // The raw score comes from the user's own answers, so it is unchanged...
    expect(skewedScale.score).toBe(seededScale.score);
    // ...but the percentile is computed against the reference distribution, which moved.
    expect(skewedScale.percentile).not.toBe(seededScale.percentile);
  });
});

describe("applyReferenceDistributions", () => {
  it("overlays stored bins onto matching questions and leaves others seeded", () => {
    const [target, other] = surveyQuestions;
    const distributions: QuestionDistributionMap = new Map([[target.id, [1, 2, 3, 4, 5, 6]]]);
    const applied = applyReferenceDistributions(surveyQuestions, {
      version: "overlay",
      distributions,
    });

    const updated = applied.find((question) => question.id === target.id)!;
    const untouched = applied.find((question) => question.id === other.id)!;

    expect(updated.visual).toMatchObject({ kind: "violin", distribution: [1, 2, 3, 4, 5, 6] });
    expect(untouched.visual).toEqual(other.visual);
  });

  it("returns the questions unchanged when there are no distributions", () => {
    const applied = applyReferenceDistributions(surveyQuestions, SEEDED_DISTRIBUTION_SET);
    expect(applied).toHaveLength(surveyQuestions.length);
    expect(applied[0].visual).toEqual(surveyQuestions[0].visual);
  });
});
