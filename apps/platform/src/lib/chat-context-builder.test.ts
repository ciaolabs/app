import { describe, expect, it } from "vitest";

import { buildSurveyChatContextFromResults } from "@/lib/chat-context-builder";
import type {
  AnySurveyResults,
  PersonalitySurveyResults,
  RankedScaleResult,
  ValuesBeliefsResults,
} from "@/lib/survey/results/types";

const now = "2026-05-01T10:00:00.000Z";

function ranked(label: string, score: number): RankedScaleResult {
  return {
    rank: 1,
    code: label,
    scaleNo: score,
    inventoryCode: "NEO",
    inventoryLabel: "NEO PI-R",
    name: label,
    displayName: label,
    description: `${label} description`,
    score,
    percentile: 80,
    percentileDirection: "higher",
    percentileMagnitude: 80,
    percentileText: "Higher than 80% of people",
    band: "High",
  };
}

const personalityResult: PersonalitySurveyResults = {
  surveyType: "personality",
  submission: {
    submissionId: "personality_submission",
    userId: "user_123",
    answerCount: 203,
    createdAt: now,
    updatedAt: now,
    submittedAt: now,
  },
  answers: { Q1: 4 },
  frameworks: [
    {
      id: "NEO",
      tabLabel: "NEO",
      heading: "Revised NEO Personality Inventory",
      methodology: "",
      intro: "",
      layout: "gauges",
      overview: [
        {
          id: "openness",
          label: "Openness",
          description: "Curiosity and openness.",
          score: 35,
          median: 25,
          iqrStart: 20,
          iqrEnd: 30,
          percentile: 75,
          percentileDirection: "higher",
          percentileMagnitude: 75,
          percentileText: "Higher than 75% of people",
          band: "High",
        },
      ],
      sections: [],
    },
  ],
  ranked: {
    highestByScore: [ranked("Imagination", 40)],
    lowestByScore: [ranked("Anxiety", 12)],
    highestByPercentile: [ranked("Imagination", 40)],
    lowestByPercentile: [ranked("Anxiety", 12)],
  },
  narrative: {
    strongestScore: ranked("Imagination", 40),
    strongestPercentile: ranked("Imagination", 40),
    strongestOthers: [],
    lowestScore: ranked("Anxiety", 12),
    lowestPercentile: ranked("Anxiety", 12),
    lowestOthers: [],
  },
};

const valuesBeliefsResult: ValuesBeliefsResults = {
  surveyType: "values-beliefs",
  submission: {
    submissionId: "values_submission",
    userId: "user_123",
    answerCount: 120,
    createdAt: now,
    updatedAt: now,
    submittedAt: now,
  },
  answers: { PVQ01: 4 },
  beliefs: {
    overview: [],
    primary: {
      id: "good",
      label: "Good",
      description: "World seen as good.",
      lowLabel: "Not good",
      highLabel: "Good",
      score: 35,
      percentile: 70,
      percentileDirection: "higher",
      percentileMagnitude: 70,
      percentileText: "Higher than 70% of reference respondents",
      comparisonLabel: "Higher",
      comparisonText: "Higher than reference respondents",
      reference: { mean: 25, sd: 10, iqrStart: 20, iqrEnd: 30 },
      band: "High",
    },
    secondary: [],
    tertiaryGroups: [],
    neutralPrimals: [],
    narrative: {
      strongest: null,
      strongestOthers: [],
      weakest: null,
      weakestOthers: [],
    },
  },
  values: {
    higherOrder: [],
    groups: [
      {
        id: "openness",
        title: "Openness to change",
        description: "Independent thought and action.",
        summary: {
          id: "openness",
          label: "Openness to change",
          description: "Independent thought and action.",
          score: 34,
          percentile: 68,
          percentileDirection: "higher",
          percentileMagnitude: 68,
          percentileText: "Higher than 68% of reference respondents",
          reference: { mean: 25, sd: 10, iqrStart: 20, iqrEnd: 30 },
          band: "High",
        },
        items: [],
      },
    ],
    otherValues: [],
    narrative: {
      strongest: null,
      strongestOthers: [],
      weakest: null,
      weakestOthers: [],
    },
  },
};

describe("buildSurveyChatContextFromResults", () => {
  it("returns an empty context when no survey results exist", () => {
    expect(buildSurveyChatContextFromResults([])).toEqual({
      personality: null,
      valuesBeliefs: null,
    });
  });

  it("compacts personality results without raw answers", () => {
    const context = buildSurveyChatContextFromResults([personalityResult]);

    expect(context.personality?.highestTraits.length).toBeGreaterThan(0);
    expect(context.personality?.frameworkOverviews.length).toBe(1);
    expect(context.valuesBeliefs).toBeNull();
    expect(JSON.stringify(context)).not.toContain("Q1");
  });

  it("compacts values and beliefs results without raw answers", () => {
    const context = buildSurveyChatContextFromResults([valuesBeliefsResult]);

    expect(context.personality).toBeNull();
    expect(context.valuesBeliefs?.beliefs.primary.label).toBe("Good");
    expect(context.valuesBeliefs?.values.groups.length).toBe(1);
    expect(JSON.stringify(context)).not.toContain("PVQ");
  });

  it("includes both survey families when both are available", () => {
    const results: AnySurveyResults[] = [personalityResult, valuesBeliefsResult];
    const context = buildSurveyChatContextFromResults(results);

    expect(context.personality).not.toBeNull();
    expect(context.valuesBeliefs).not.toBeNull();
  });
});
