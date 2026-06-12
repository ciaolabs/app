import type {
  CompactScore,
  PersonalityChatContext,
  SurveyChatContext,
  ValuesBeliefsChatContext,
} from "@ciaobang/chat-context";

import {
  AnySurveyResults,
  OverviewMetricResult,
  PersonalitySurveyResults,
  PolarScaleResult,
  RankedScaleResult,
  ValuesBeliefsResults,
  ValuesScaleResult,
} from "@/lib/survey/results/types";

export type { PersonalityChatContext, SurveyChatContext, ValuesBeliefsChatContext };

function rankedToCompact(item: RankedScaleResult): CompactScore {
  return {
    label: item.displayName,
    score: item.score,
    band: item.band,
    percentileText: item.percentileText,
    description: item.description,
  };
}

function overviewToCompact(item: OverviewMetricResult): CompactScore {
  return {
    label: item.label,
    score: item.score,
    band: item.band,
    percentileText: item.percentileText,
    description: item.description,
  };
}

function polarToCompact(item: PolarScaleResult): CompactScore {
  return {
    label: item.label,
    score: item.score,
    band: item.band,
    percentileText: item.percentileText,
    description: item.description,
  };
}

function valueToCompact(item: ValuesScaleResult): CompactScore {
  return {
    label: item.label,
    score: item.score,
    band: item.band,
    percentileText: item.percentileText,
    description: item.description,
  };
}

function compactPersonalityResults(results: PersonalitySurveyResults): PersonalityChatContext {
  return {
    submittedAt: results.submission.submittedAt,
    strongestScore: results.narrative.strongestScore
      ? rankedToCompact(results.narrative.strongestScore)
      : null,
    strongestPercentile: results.narrative.strongestPercentile
      ? rankedToCompact(results.narrative.strongestPercentile)
      : null,
    lowestScore: results.narrative.lowestScore ? rankedToCompact(results.narrative.lowestScore) : null,
    lowestPercentile: results.narrative.lowestPercentile
      ? rankedToCompact(results.narrative.lowestPercentile)
      : null,
    highestTraits: results.ranked.highestByScore.slice(0, 8).map(rankedToCompact),
    lowestTraits: results.ranked.lowestByScore.slice(0, 8).map(rankedToCompact),
    frameworkOverviews: results.frameworks.map((framework) => ({
      framework: framework.heading,
      metrics: framework.overview.map(overviewToCompact),
    })),
  };
}

function compactValuesBeliefsResults(results: ValuesBeliefsResults): ValuesBeliefsChatContext {
  return {
    submittedAt: results.submission.submittedAt,
    beliefs: {
      primary: polarToCompact(results.beliefs.primary),
      strongest: results.beliefs.narrative.strongest
        ? polarToCompact(results.beliefs.narrative.strongest)
        : null,
      weakest: results.beliefs.narrative.weakest
        ? polarToCompact(results.beliefs.narrative.weakest)
        : null,
      secondary: results.beliefs.secondary.map(polarToCompact),
    },
    values: {
      strongest: results.values.narrative.strongest
        ? valueToCompact(results.values.narrative.strongest)
        : null,
      weakest: results.values.narrative.weakest
        ? valueToCompact(results.values.narrative.weakest)
        : null,
      higherOrder: results.values.higherOrder.map(valueToCompact),
      groups: results.values.groups.map((group) => ({
        group: group.title,
        summary: valueToCompact(group.summary),
        values: group.items.map(valueToCompact),
      })),
    },
  };
}

export function buildSurveyChatContextFromResults(
  results: readonly AnySurveyResults[],
): SurveyChatContext {
  const context: SurveyChatContext = {
    personality: null,
    valuesBeliefs: null,
  };

  for (const result of results) {
    if (result.surveyType === "personality") {
      context.personality = compactPersonalityResults(result);
    }

    if (result.surveyType === "values-beliefs") {
      context.valuesBeliefs = compactValuesBeliefsResults(result);
    }
  }

  return context;
}
