import { tool } from "ai";
import { z } from "zod";

import type {
  CompactScore,
  SurveyChatContext,
} from "@/lib/chat/survey-context";

const SECTION_VALUES = [
  "personality.highest_traits",
  "personality.lowest_traits",
  "personality.frameworks",
  "values.strongest",
  "values.weakest",
  "values.higher_order",
  "values.groups",
  "beliefs.primary",
  "beliefs.strongest",
  "beliefs.weakest",
  "beliefs.secondary",
] as const;

type SectionId = (typeof SECTION_VALUES)[number];

function recallSection(context: SurveyChatContext, section: SectionId) {
  const personality = context.personality;
  const valuesBeliefs = context.valuesBeliefs;

  switch (section) {
    case "personality.highest_traits":
      return personality?.highestTraits ?? [];
    case "personality.lowest_traits":
      return personality?.lowestTraits ?? [];
    case "personality.frameworks":
      return personality?.frameworkOverviews ?? [];
    case "values.strongest":
      return valuesBeliefs?.values.strongest ?? null;
    case "values.weakest":
      return valuesBeliefs?.values.weakest ?? null;
    case "values.higher_order":
      return valuesBeliefs?.values.higherOrder ?? [];
    case "values.groups":
      return valuesBeliefs?.values.groups ?? [];
    case "beliefs.primary":
      return valuesBeliefs?.beliefs.primary ?? null;
    case "beliefs.strongest":
      return valuesBeliefs?.beliefs.strongest ?? null;
    case "beliefs.weakest":
      return valuesBeliefs?.beliefs.weakest ?? null;
    case "beliefs.secondary":
      return valuesBeliefs?.beliefs.secondary ?? [];
  }
}

function collectAllScores(context: SurveyChatContext): CompactScore[] {
  const out: CompactScore[] = [];
  const personality = context.personality;
  const valuesBeliefs = context.valuesBeliefs;

  if (personality) {
    if (personality.strongestScore) out.push(personality.strongestScore);
    if (personality.strongestPercentile) out.push(personality.strongestPercentile);
    if (personality.lowestScore) out.push(personality.lowestScore);
    if (personality.lowestPercentile) out.push(personality.lowestPercentile);
    out.push(...personality.highestTraits);
    out.push(...personality.lowestTraits);
    for (const fw of personality.frameworkOverviews) {
      out.push(...fw.metrics);
    }
  }

  if (valuesBeliefs) {
    out.push(valuesBeliefs.beliefs.primary);
    if (valuesBeliefs.beliefs.strongest) out.push(valuesBeliefs.beliefs.strongest);
    if (valuesBeliefs.beliefs.weakest) out.push(valuesBeliefs.beliefs.weakest);
    out.push(...valuesBeliefs.beliefs.secondary);
    if (valuesBeliefs.values.strongest) out.push(valuesBeliefs.values.strongest);
    if (valuesBeliefs.values.weakest) out.push(valuesBeliefs.values.weakest);
    out.push(...valuesBeliefs.values.higherOrder);
    for (const group of valuesBeliefs.values.groups) {
      out.push(group.summary);
      out.push(...group.values);
    }
  }

  // Deduplicate by label.
  const seen = new Set<string>();
  return out.filter((s) => {
    const key = s.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function makeSurveyContextTools(context: SurveyChatContext) {
  return {
    recallSurveyDetail: tool({
      description:
        "Pull a specific section of the user's saved survey results. Use to focus on one slice of the data (e.g., top personality traits, strongest values, primary belief) before reasoning about it.",
      inputSchema: z.object({
        section: z
          .enum(SECTION_VALUES)
          .describe("Which slice of the saved survey context to retrieve."),
      }),
      execute: async ({ section }) => {
        const data = recallSection(context, section);
        return { section, data };
      },
    }),
    compareDimensions: tool({
      description:
        "Compare two or more named scores from the user's survey results side by side. Provide the exact labels (case-insensitive). Useful for cross-referencing traits with values or beliefs.",
      inputSchema: z.object({
        labels: z
          .array(z.string().min(1))
          .min(2)
          .max(4)
          .describe("Two to four exact score labels to compare."),
      }),
      execute: async ({ labels }) => {
        const all = collectAllScores(context);
        const results = labels.map((label) => {
          const found = all.find(
            (s) => s.label.toLowerCase() === label.toLowerCase(),
          );
          if (!found) return { label, found: false as const };
          return {
            label: found.label,
            found: true as const,
            score: found.score,
            band: found.band,
            percentile: found.percentileText,
            description: found.description,
          };
        });
        return { results };
      },
    }),
  };
}
