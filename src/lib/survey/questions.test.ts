import { describe, expect, it } from "vitest";

import { QUESTION_COUNT } from "@/lib/survey/constants";
import { LIKERT_LABELS } from "@/lib/survey/types";
import { surveyQuestions } from "@/lib/survey/questions";

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
      expect(question.responseScale.options.map((option) => option.label)).toEqual(LIKERT_LABELS);
      expect(question.visual?.kind).toBe("violin");
      expect(question.visual?.distribution).toHaveLength(LIKERT_LABELS.length);
      expect(question.visual?.distribution.every((value) => value > 0)).toBe(true);
    }
  });
});
