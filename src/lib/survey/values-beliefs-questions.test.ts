import { describe, expect, it } from "vitest";

import { getSurveyQuestions } from "@/lib/survey/questions";
import {
  BELIEFS_RESPONSE_OPTION_LABELS,
  VALUES_RESPONSE_OPTION_LABELS,
} from "@/lib/survey/types";

describe("valuesBeliefsSurveyQuestions", () => {
  const questions = getSurveyQuestions("values-beliefs");

  it("ships the full combined item set with stable ordering", () => {
    expect(questions).toHaveLength(156);
    expect(new Set(questions.map((question) => question.id)).size).toBe(156);
    expect(questions[0]).toMatchObject({
      id: "PWB01",
      order: 1,
      section: { id: "beliefs" },
    });
    expect(questions[98]).toMatchObject({
      id: "PWB99",
      order: 99,
      section: { id: "beliefs" },
    });
    expect(questions[99]).toMatchObject({
      id: "PVQ01",
      order: 100,
      section: { id: "values" },
    });
    expect(questions[155]).toMatchObject({
      id: "PVQ57",
      order: 156,
      section: { id: "values" },
    });
  });

  it("applies the correct response scales and neutral portrait wording", () => {
    const beliefsLabels = questions[0]?.responseScale.options.map((option) => option.label);
    const valuesLabels = questions[99]?.responseScale.options.map((option) => option.label);

    expect(beliefsLabels).toEqual(BELIEFS_RESPONSE_OPTION_LABELS);
    expect(valuesLabels).toEqual(VALUES_RESPONSE_OPTION_LABELS);
    expect(questions[99]?.prompt).toContain("them");
    expect(questions[99]?.prompt.toLowerCase()).not.toContain(" him ");
    expect(questions[99]?.prompt.toLowerCase()).not.toContain(" his ");
    expect(questions.every((question) => question.visual?.kind === "violin")).toBe(true);
    expect(questions.every((question) => question.visual?.distribution.length === 6)).toBe(true);
    expect(questions.every((question) => question.visual?.distribution.every((count) => count > 0))).toBe(true);
  });
});
