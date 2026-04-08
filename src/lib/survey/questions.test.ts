import { describe, expect, it } from "vitest";

import { LIKERT_LABELS } from "@/lib/survey/types";
import { QUESTION_COUNT, surveyQuestions } from "@/lib/survey/questions";

describe("surveyQuestions", () => {
  it("ships the full AMBI item set with stable ordering", () => {
    expect(QUESTION_COUNT).toBe(181);
    expect(surveyQuestions).toHaveLength(181);
    expect(new Set(surveyQuestions.map((question) => question.id)).size).toBe(181);
    expect(surveyQuestions[0]).toMatchObject({
      order: 1,
      id: "D79",
      prompt: "I rarely worry.",
    });
    expect(surveyQuestions[60]).toMatchObject({
      order: 61,
      id: "V62",
      prompt: "I believe it is always better to be safe than sorry.",
    });
  });

  it("provides complete labels and seeded distributions for every question", () => {
    for (const question of surveyQuestions) {
      expect(question.labels).toEqual(LIKERT_LABELS);
      expect(question.seededDistribution).toHaveLength(LIKERT_LABELS.length);
      expect(question.seededDistribution.every((value) => value > 0)).toBe(true);
    }
  });
});
