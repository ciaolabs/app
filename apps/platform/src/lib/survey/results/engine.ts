import { surveyQuestions } from "@/lib/survey/questions";
import { clamp, hashSeed, mulberry32 } from "@/lib/survey/results/math";
import {
  percentileDetailsFor,
  scoreBandFor,
} from "@/lib/survey/results/score-band";
import { type SurveyAnswers, type SurveySubmission } from "@/lib/survey/types";
import {
  frameworkDefinitions,
  inventoryOrder,
  scaleDisplayOverrides,
} from "@/lib/survey/results/metadata";
import { ambiScaleDefinitionMap, ambiScaleDefinitions } from "@/lib/survey/results/scoring-data";
import { buildValuesBeliefsResults } from "@/lib/survey/results/values-beliefs-engine";
import {
  type AnySurveyResults,
  type FrameworkDefinition,
  type FrameworkResult,
  type FrameworkSectionResult,
  type OverviewMetricDefinition,
  type OverviewMetricResult,
  type RankedScaleResult,
  type ScaleDefinition,
  type ScaleResult,
  type SurveyResults,
  type ValuesBeliefsResults,
} from "@/lib/survey/results/types";
import {
  PERSONALITY_COMPARISON_NOUN,
  compareByPercentileAsc,
  compareByPercentileDesc,
  compareByScoreAsc,
  compareByScoreDesc,
  displayScoreFromKeyedSum,
  keyedItemValue,
} from "@/lib/survey/results/scoring-utils";

type ProbabilityDistribution = number[];

const QUESTION_BY_ORDER = new Map(surveyQuestions.map((question) => [question.order, question]));
const scaleDistributionCache = new Map<string, ProbabilityDistribution>();
const overviewSimulationCache = new Map<string, number[]>();

function questionProbabilities(order: number, reverse = false) {
  const question = QUESTION_BY_ORDER.get(order);

  if (!question) {
    throw new Error(`Unknown AMBI question order: ${order}`);
  }

  if (question.visual?.kind !== "violin") {
    throw new Error(`Question ${order} is missing a seeded AMBI distribution.`);
  }

  const total = question.visual.distribution.reduce((sum, count) => sum + count, 0);
  const probabilities = question.visual.distribution.map((count) => count / total);

  return reverse ? [...probabilities].reverse() : probabilities;
}

function keyedAnswerSum(definition: ScaleDefinition, answers: SurveyAnswers) {
  return definition.keyedItems.reduce((sum, keyedItem) => {
    const rawValue = answers[QUESTION_BY_ORDER.get(keyedItem.order)?.id ?? ""];

    if (!rawValue) {
      throw new Error(
        `Missing answer for AMBI question ${keyedItem.order} while scoring ${definition.code}.`,
      );
    }

    return sum + keyedItemValue(rawValue, keyedItem.reverse);
  }, 0);
}

function buildScaleDistribution(definition: ScaleDefinition) {
  const cached = scaleDistributionCache.get(definition.code);

  if (cached) {
    return cached;
  }

  let distribution = [1];

  for (const keyedItem of definition.keyedItems) {
    const probabilities = questionProbabilities(keyedItem.order, keyedItem.reverse);
    const nextDistribution = Array.from(
      { length: distribution.length + probabilities.length },
      () => 0,
    );

    for (let currentSum = 0; currentSum < distribution.length; currentSum += 1) {
      const currentProbability = distribution[currentSum];

      if (currentProbability === 0) {
        continue;
      }

      for (let ratingIndex = 0; ratingIndex < probabilities.length; ratingIndex += 1) {
        const ratingValue = ratingIndex + 1;
        nextDistribution[currentSum + ratingValue] += currentProbability * probabilities[ratingIndex];
      }
    }

    distribution = nextDistribution;
  }

  scaleDistributionCache.set(definition.code, distribution);
  return distribution;
}

function percentileFromDistribution(distribution: ProbabilityDistribution, observedSum: number) {
  let lowerProbability = 0;
  let equalProbability = 0;

  for (let score = 0; score < distribution.length; score += 1) {
    const probability = distribution[score] ?? 0;

    if (score < observedSum) {
      lowerProbability += probability;
    } else if (score === observedSum) {
      equalProbability += probability;
    }
  }

  return (lowerProbability + equalProbability * 0.5) * 100;
}

function sampleFromProbabilities(probabilities: number[], random: () => number) {
  const target = random();
  let cumulative = 0;

  for (let index = 0; index < probabilities.length; index += 1) {
    cumulative += probabilities[index];
    if (target <= cumulative) {
      return index + 1;
    }
  }

  return probabilities.length;
}

function calibratedOverviewScore(metric: OverviewMetricDefinition, childResults: ScaleResult[]) {
  const mean = childResults.reduce((sum, item) => sum + item.score, 0) / childResults.length;
  return clamp(Math.round(mean + (metric.scoreOffset ?? 0)), 0, 50);
}

function buildOverviewSimulation(metric: OverviewMetricDefinition) {
  const cacheKey = `${metric.id}:${metric.scaleNumbers.join(",")}:${metric.scoreOffset ?? 0}`;
  const cached = overviewSimulationCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const scaleDefinitions = metric.scaleNumbers.map((scaleNumber) => {
    const definition = ambiScaleDefinitionMap.get(scaleNumber);

    if (!definition) {
      throw new Error(`Missing scale definition for overview scale ${scaleNumber}.`);
    }

    return definition;
  });

  const uniqueOrders = Array.from(
    new Set(scaleDefinitions.flatMap((definition) => definition.keyedItems.map((item) => item.order))),
  ).sort((left, right) => left - right);
  const orderToQuestionId = new Map(
    uniqueOrders.map((order) => [order, QUESTION_BY_ORDER.get(order)?.id ?? ""]),
  );
  const random = mulberry32(hashSeed(cacheKey));
  const simulations: number[] = [];

  for (let index = 0; index < 4096; index += 1) {
    const sampleAnswers: SurveyAnswers = {};

    for (const order of uniqueOrders) {
      const questionId = orderToQuestionId.get(order);

      if (!questionId) {
        continue;
      }

      sampleAnswers[questionId] = sampleFromProbabilities(questionProbabilities(order), random) as 1;
    }

    const childScores = scaleDefinitions.map((definition) =>
      displayScoreFromKeyedSum(keyedAnswerSum(definition, sampleAnswers), definition.keyedItems.length),
    );
    const mean = childScores.reduce((sum, value) => sum + value, 0) / childScores.length;
    simulations.push(clamp(Math.round(mean + (metric.scoreOffset ?? 0)), 0, 50));
  }

  simulations.sort((left, right) => left - right);
  overviewSimulationCache.set(cacheKey, simulations);
  return simulations;
}

function percentileFromSamples(samples: number[], observed: number) {
  let lower = 0;
  let equal = 0;

  for (const value of samples) {
    if (value < observed) {
      lower += 1;
    } else if (value === observed) {
      equal += 1;
    }
  }

  return ((lower + equal * 0.5) / samples.length) * 100;
}

function quantileFromSortedSamples(samples: number[], quantile: number) {
  if (samples.length === 0) {
    return 0;
  }

  const clampedQuantile = clamp(quantile, 0, 1);
  const index = (samples.length - 1) * clampedQuantile;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  const lowerValue = samples[lowerIndex] ?? samples[0] ?? 0;
  const upperValue = samples[upperIndex] ?? samples[samples.length - 1] ?? lowerValue;

  if (lowerIndex === upperIndex) {
    return lowerValue;
  }

  const interpolation = index - lowerIndex;
  return lowerValue + (upperValue - lowerValue) * interpolation;
}

function fallbackDescription(definition: ScaleDefinition) {
  return `AMBI estimate aligned to the ${definition.name} construct from the ${definition.inventoryLabel}.`;
}

function scoreScale(definition: ScaleDefinition, answers: SurveyAnswers): ScaleResult {
  const keyedSum = keyedAnswerSum(definition, answers);
  const displayScore = displayScoreFromKeyedSum(keyedSum, definition.keyedItems.length);
  const percentile = percentileFromDistribution(buildScaleDistribution(definition), keyedSum);
  const percentileDetails = percentileDetailsFor(percentile, PERSONALITY_COMPARISON_NOUN);
  const override = scaleDisplayOverrides[definition.scaleNo];

  return {
    code: definition.code,
    scaleNo: definition.scaleNo,
    inventoryCode: definition.inventoryCode,
    inventoryLabel: definition.inventoryLabel,
    name: definition.name,
    displayName: override?.displayName ?? definition.name,
    description: override?.description ?? fallbackDescription(definition),
    keyedItemCount: definition.keyedItems.length,
    score: displayScore,
    meanScore: keyedSum / definition.keyedItems.length,
    percentile: percentileDetails.percentile,
    percentileDirection: percentileDetails.percentileDirection,
    percentileMagnitude: percentileDetails.percentileMagnitude,
    percentileText: percentileDetails.percentileText,
    band: scoreBandFor(displayScore),
    reliability: {
      convergentCorrelation: definition.convergentCorrelation,
      alphaGa: definition.alphaGa,
      alphaOriginal: definition.alphaOriginal,
    },
  };
}

function buildOverviewResults(
  definition: FrameworkDefinition,
  scaleResultsByNumber: Map<number, ScaleResult>,
): OverviewMetricResult[] {
  return definition.overview.map((metric) => {
    const childResults = metric.scaleNumbers
      .map((scaleNumber) => scaleResultsByNumber.get(scaleNumber))
      .filter((value): value is ScaleResult => Boolean(value));
    const score = calibratedOverviewScore(metric, childResults);
    const simulations = buildOverviewSimulation(metric);
    const percentile = percentileFromSamples(simulations, score);
    const percentileDetails = percentileDetailsFor(percentile, PERSONALITY_COMPARISON_NOUN);
    const median = Math.round(quantileFromSortedSamples(simulations, 0.5));
    const iqrStart = Math.round(quantileFromSortedSamples(simulations, 0.25));
    const iqrEnd = Math.round(quantileFromSortedSamples(simulations, 0.75));

    return {
      id: metric.id,
      label: metric.label,
      description: metric.description,
      score,
      median,
      iqrStart,
      iqrEnd,
      percentile: percentileDetails.percentile,
      percentileDirection: percentileDetails.percentileDirection,
      percentileMagnitude: percentileDetails.percentileMagnitude,
      percentileText: percentileDetails.percentileText,
      band: scoreBandFor(score),
    };
  });
}

function buildFrameworkSections(
  definition: FrameworkDefinition,
  scaleResultsByNumber: Map<number, ScaleResult>,
): FrameworkSectionResult[] {
  return definition.sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    items: section.scaleNumbers
      .map((scaleNumber) => scaleResultsByNumber.get(scaleNumber))
      .filter((value): value is ScaleResult => Boolean(value))
      .sort(compareByScoreDesc),
  }));
}

function toRankedScaleResults(results: ScaleResult[], comparator: (left: ScaleResult, right: ScaleResult) => number) {
  return [...results]
    .sort(comparator)
    .map<RankedScaleResult>((result, index) => ({
      rank: index + 1,
      code: result.code,
      scaleNo: result.scaleNo,
      inventoryCode: result.inventoryCode,
      inventoryLabel: result.inventoryLabel,
      name: result.name,
      displayName: result.displayName,
      description: result.description,
      score: result.score,
      percentile: result.percentile,
      percentileDirection: result.percentileDirection,
      percentileMagnitude: result.percentileMagnitude,
      percentileText: result.percentileText,
      band: result.band,
    }));
}

function buildFrameworkResults(scaleResultsByNumber: Map<number, ScaleResult>) {
  return inventoryOrder.map<FrameworkResult>((inventoryCode) => {
    const definition = frameworkDefinitions[inventoryCode];

    return {
      id: definition.id,
      tabLabel: definition.tabLabel,
      heading: definition.heading,
      methodology: definition.methodology,
      intro: definition.intro,
      readMoreText: definition.readMoreText,
      layout: definition.layout,
      overview: buildOverviewResults(definition, scaleResultsByNumber),
      sections: buildFrameworkSections(definition, scaleResultsByNumber),
    };
  });
}

export function buildPersonalitySurveyResults(submission: SurveySubmission): SurveyResults {
  const scaleResults = ambiScaleDefinitions.map((definition) => scoreScale(definition, submission.answers));
  const scaleResultsByNumber = new Map(scaleResults.map((result) => [result.scaleNo, result]));
  const highestByScore = toRankedScaleResults(scaleResults, compareByScoreDesc);
  const lowestByScore = toRankedScaleResults(scaleResults, compareByScoreAsc);
  const highestByPercentile = toRankedScaleResults(scaleResults, compareByPercentileDesc);
  const lowestByPercentile = toRankedScaleResults(scaleResults, compareByPercentileAsc);

  return {
    surveyType: "personality",
    submission: {
      submissionId: submission.submissionId,
      userId: submission.userId,
      answerCount: submission.answerCount,
      submittedAt: submission.submittedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    },
    answers: submission.answers,
    frameworks: buildFrameworkResults(scaleResultsByNumber),
    ranked: {
      highestByScore,
      lowestByScore,
      highestByPercentile,
      lowestByPercentile,
    },
    narrative: {
      strongestScore: highestByScore[0] ?? null,
      strongestPercentile: highestByPercentile[0] ?? null,
      strongestOthers: highestByScore.slice(1, 4),
      lowestScore: lowestByScore[0] ?? null,
      lowestPercentile: lowestByPercentile[0] ?? null,
      lowestOthers: lowestByScore.slice(1, 4),
    },
  };
}

export function buildSurveyResults(
  submission: SurveySubmission & { surveyType: "personality" },
): SurveyResults;
export function buildSurveyResults(
  submission: SurveySubmission & { surveyType: "values-beliefs" },
): ValuesBeliefsResults;
export function buildSurveyResults(submission: SurveySubmission): AnySurveyResults;
export function buildSurveyResults(submission: SurveySubmission): AnySurveyResults {
  if (submission.surveyType === "values-beliefs") {
    return buildValuesBeliefsResults(submission);
  }

  return buildPersonalitySurveyResults(submission);
}
