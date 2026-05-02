import { type SurveyAnswers, type SurveySubmission } from "@/lib/survey/types";
import {
  PRIMAL_AGGREGATE_ITEM_NUMBERS,
  PRIMAL_PRIMARY_REFERENCE,
  PRIMAL_SECONDARY_REFERENCES,
  PRIMAL_TERTIARY_SCALES,
  PVQ_RR_BASIC_VALUES,
  PVQ_RR_HIGHER_ORDER_VALUES,
  type ReferenceScaleStats,
} from "@/lib/survey/values-beliefs-source";
import {
  type BeliefsResultTab,
  type PolarScaleResult,
  type ReferenceDistribution,
  type ScoreBand,
  type ValuesBeliefsResults,
  type ValuesResultTab,
  type ValuesScaleResult,
} from "@/lib/survey/results/types";

const MIN_PERCENTILE = 1;
const MAX_PERCENTILE = 99;

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(maxValue, Math.max(minValue, value));
}

function erfApproximation(value: number) {
  const sign = value < 0 ? -1 : 1;
  const absoluteValue = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * absoluteValue);
  const polynomial =
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t);
  const estimate = 1 - polynomial * Math.exp(-(absoluteValue ** 2));

  return sign * estimate;
}

function normalCdf(value: number, mean: number, sd: number) {
  if (sd <= 0) {
    return value < mean ? 0 : 1;
  }

  return 0.5 * (1 + erfApproximation((value - mean) / (sd * Math.SQRT2)));
}

function toScoreBand(score: number): ScoreBand {
  if (score >= 31) {
    return "High";
  }

  if (score <= 19) {
    return "Low";
  }

  return "Middle";
}

function toPercentileDetails(percentile: number) {
  const normalized = clamp(Math.round(percentile), MIN_PERCENTILE, MAX_PERCENTILE);

  if (normalized >= 50) {
    return {
      percentile: normalized,
      percentileDirection: "higher" as const,
      percentileMagnitude: normalized,
      percentileText: `Higher than ${normalized}% of reference respondents`,
    };
  }

  const percentileMagnitude = 100 - normalized;

  return {
    percentile: normalized,
    percentileDirection: "lower" as const,
    percentileMagnitude,
    percentileText: `Lower than ${percentileMagnitude}% of reference respondents`,
  };
}

function toReferenceDistribution(reference: ReferenceScaleStats): ReferenceDistribution {
  const iqrOffset = 0.67448975 * reference.sd;

  return {
    mean: clamp(Math.round(reference.mean), 0, 50),
    sd: reference.sd,
    iqrStart: clamp(Math.round(reference.mean - iqrOffset), 0, 50),
    iqrEnd: clamp(Math.round(reference.mean + iqrOffset), 0, 50),
  };
}

function toDisplayScore(meanScore: number) {
  return clamp(Math.round(((meanScore - 1) / 5) * 50), 0, 50);
}

function beliefQuestionId(itemNumber: number) {
  return `PWB${itemNumber.toString().padStart(2, "0")}`;
}

function valueQuestionId(itemNumber: number) {
  return `PVQ${itemNumber.toString().padStart(2, "0")}`;
}

function keyedBeliefValue(rawValue: number, reverse: boolean) {
  return reverse ? 7 - rawValue : rawValue;
}

function scoreBeliefItems(
  answers: SurveyAnswers,
  itemNumbers: readonly number[],
  reverseItemNumbers: readonly number[],
) {
  const reverseSet = new Set(reverseItemNumbers);
  const keyedValues = itemNumbers.map((itemNumber) => {
    const answer = answers[beliefQuestionId(itemNumber)];

    if (!answer) {
      throw new Error(`Missing answer for belief item ${itemNumber}.`);
    }

    return keyedBeliefValue(answer, reverseSet.has(itemNumber));
  });

  const meanScore = keyedValues.reduce((sum, value) => sum + value, 0) / keyedValues.length;
  return toDisplayScore(meanScore);
}

function scoreValuesItems(answers: SurveyAnswers, itemNumbers: readonly number[]) {
  const rawValues = itemNumbers.map((itemNumber) => {
    const answer = answers[valueQuestionId(itemNumber)];

    if (!answer) {
      throw new Error(`Missing answer for values item ${itemNumber}.`);
    }

    return answer;
  });

  const meanScore = rawValues.reduce((sum, value) => sum + value, 0) / rawValues.length;
  return toDisplayScore(meanScore);
}

function scoreFromReference(score: number, reference: ReferenceScaleStats) {
  const percentile = normalCdf(score, reference.mean, reference.sd) * 100;
  const percentileDetails = toPercentileDetails(percentile);

  return {
    ...percentileDetails,
    reference: toReferenceDistribution(reference),
    band: toScoreBand(score),
  };
}

function buildPolarScaleResult(params: {
  id: string;
  label: string;
  description: string;
  lowLabel: string;
  highLabel: string;
  score: number;
  reference: ReferenceScaleStats;
}): PolarScaleResult {
  const referenceDetails = scoreFromReference(params.score, params.reference);
  const comparisonLabel =
    referenceDetails.percentileDirection === "higher" ? params.highLabel : params.lowLabel;
  const comparisonVerb =
    referenceDetails.percentileDirection === "higher" ? "More" : "Less";

  return {
    id: params.id,
    label: params.label,
    description: params.description,
    lowLabel: params.lowLabel,
    highLabel: params.highLabel,
    score: params.score,
    percentile: referenceDetails.percentile,
    percentileDirection: referenceDetails.percentileDirection,
    percentileMagnitude: referenceDetails.percentileMagnitude,
    percentileText: referenceDetails.percentileText,
    comparisonLabel,
    comparisonText: `${comparisonVerb} ${params.highLabel} than ${referenceDetails.percentileMagnitude}% of reference respondents`,
    reference: referenceDetails.reference,
    band: referenceDetails.band,
  };
}

function buildValuesScaleResult(params: {
  id: string;
  label: string;
  description: string;
  score: number;
  reference: ReferenceScaleStats;
}): ValuesScaleResult {
  const referenceDetails = scoreFromReference(params.score, params.reference);

  return {
    id: params.id,
    label: params.label,
    description: params.description,
    score: params.score,
    percentile: referenceDetails.percentile,
    percentileDirection: referenceDetails.percentileDirection,
    percentileMagnitude: referenceDetails.percentileMagnitude,
    percentileText: referenceDetails.percentileText,
    reference: referenceDetails.reference,
    band: referenceDetails.band,
  };
}

function buildBeliefsResults(answers: SurveyAnswers): BeliefsResultTab {
  const tertiaryResults = PRIMAL_TERTIARY_SCALES.map((scale) =>
    buildPolarScaleResult({
      id: scale.code,
      label: scale.label,
      description: scale.description,
      lowLabel: scale.lowLabel,
      highLabel: scale.highLabel,
      score: scoreBeliefItems(answers, scale.itemNumbers, scale.reverseItemNumbers),
      reference: scale.reference,
    }),
  );
  const tertiaryById = new Map(tertiaryResults.map((result) => [result.id, result]));

  const primary = buildPolarScaleResult({
    id: "good",
    label: "Good",
    description:
      "Belief that the world is fundamentally good rather than bad.",
    lowLabel: "Bad",
    highLabel: "Good",
    score: scoreBeliefItems(answers, PRIMAL_AGGREGATE_ITEM_NUMBERS.good, [
      7, 14, 23, 24, 25, 29, 31, 34, 44, 51, 52, 53, 60, 64, 65, 66, 71, 72, 73,
      77, 78, 81, 84, 85, 86, 87, 91, 92, 96, 97,
    ]),
    reference: PRIMAL_PRIMARY_REFERENCE,
  });

  const secondary = [
    buildPolarScaleResult({
      id: "enticing",
      label: "Enticing",
      description:
        "Belief that the world is full of beauty, meaning, and interesting opportunities worth exploring.",
      lowLabel: "Dull",
      highLabel: "Enticing",
      score: scoreBeliefItems(answers, PRIMAL_AGGREGATE_ITEM_NUMBERS.enticing, [
        7, 14, 51, 52, 53, 64, 65, 66, 96, 97,
      ]),
      reference: PRIMAL_SECONDARY_REFERENCES.enticing,
    }),
    buildPolarScaleResult({
      id: "safe",
      label: "Safe",
      description:
        "Belief that the world is fair, stable, comfortable, and more safe than dangerous.",
      lowLabel: "Dangerous",
      highLabel: "Safe",
      score: scoreBeliefItems(answers, PRIMAL_AGGREGATE_ITEM_NUMBERS.safe, [
        23, 24, 25, 31, 34, 60, 72, 73, 77, 78, 81, 84, 85, 86, 87,
      ]),
      reference: PRIMAL_SECONDARY_REFERENCES.safe,
    }),
    buildPolarScaleResult({
      id: "alive",
      label: "Alive",
      description:
        "Belief that life is shaped by purpose, participation, and responsiveness rather than by impersonal mechanics alone.",
      lowLabel: "Mechanistic",
      highLabel: "Alive",
      score: scoreBeliefItems(answers, PRIMAL_AGGREGATE_ITEM_NUMBERS.alive, [4, 48, 49, 71]),
      reference: PRIMAL_SECONDARY_REFERENCES.alive,
    }),
  ];

  const tertiaryGroups = [
    {
      id: "enticing-tertiary",
      title: "Enticing vs. Dull",
      description:
        "These scales reflect how inviting, beautiful, meaningful, and worth exploring the world feels.",
      items: [
        tertiaryById.get("meaningful"),
        tertiaryById.get("interesting"),
        tertiaryById.get("worth-exploring"),
        tertiaryById.get("abundant"),
        tertiaryById.get("improvable"),
        tertiaryById.get("beautiful"),
        tertiaryById.get("funny"),
      ].filter((value): value is PolarScaleResult => Boolean(value)),
    },
    {
      id: "safe-tertiary",
      title: "Safe vs. Dangerous",
      description:
        "These scales reflect how cooperative, harmless, stable, pleasurable, and just the world feels.",
      items: [
        tertiaryById.get("cooperative"),
        tertiaryById.get("harmless"),
        tertiaryById.get("pleasurable"),
        tertiaryById.get("progressing"),
        tertiaryById.get("just"),
        tertiaryById.get("stable"),
        tertiaryById.get("regenerative"),
      ].filter((value): value is PolarScaleResult => Boolean(value)),
    },
    {
      id: "alive-tertiary",
      title: "Alive vs. Mechanistic",
      description:
        "These scales reflect how purposeful, interactive, and personally involving the world feels.",
      items: [
        tertiaryById.get("needs-me"),
        tertiaryById.get("about-me"),
        tertiaryById.get("intentional"),
      ].filter((value): value is PolarScaleResult => Boolean(value)),
    },
  ];

  const neutralPrimals = [
    tertiaryById.get("changing"),
    tertiaryById.get("hierarchical"),
    tertiaryById.get("interconnected"),
    tertiaryById.get("understandable"),
    tertiaryById.get("acceptable"),
  ].filter((value): value is PolarScaleResult => Boolean(value));

  const rankedTertiary = [...tertiaryResults].sort((left, right) => {
    if (right.percentile !== left.percentile) {
      return right.percentile - left.percentile;
    }

    return right.score - left.score;
  });

  return {
    overview: [primary, ...secondary],
    primary,
    secondary,
    tertiaryGroups,
    neutralPrimals,
    narrative: {
      strongest: rankedTertiary[0] ?? null,
      strongestOthers: rankedTertiary.slice(1, 4),
      weakest: [...rankedTertiary].reverse()[0] ?? null,
      weakestOthers: [...rankedTertiary].reverse().slice(1, 4),
    },
  };
}

function buildValuesResults(answers: SurveyAnswers): ValuesResultTab {
  const basicResults = PVQ_RR_BASIC_VALUES.map((definition) =>
    buildValuesScaleResult({
      id: definition.code,
      label: definition.label,
      description: definition.description,
      score: scoreValuesItems(answers, definition.itemNumbers),
      reference: definition.reference,
    }),
  );
  const basicById = new Map(basicResults.map((result) => [result.id, result]));

  const higherOrder = PVQ_RR_HIGHER_ORDER_VALUES.map((definition) => {
    const childScores = definition.basicValueCodes
      .map((code) => basicById.get(code)?.score ?? 0);
    const score =
      childScores.reduce((sum, value) => sum + value, 0) / childScores.length;

    return buildValuesScaleResult({
      id: definition.code,
      label: definition.label,
      description: definition.description,
      score: Math.round(score),
      reference: definition.reference,
    });
  });
  const higherOrderById = new Map(higherOrder.map((result) => [result.id, result]));

  const groups = PVQ_RR_HIGHER_ORDER_VALUES.map((definition) => ({
    id: definition.code,
    title: definition.label,
    description: definition.description,
    summary: higherOrderById.get(definition.code)!,
    items: definition.basicValueCodes
      .map((code) => basicById.get(code))
      .filter((value): value is ValuesScaleResult => Boolean(value)),
  }));

  const otherValues = ["face", "humility"]
    .map((code) => basicById.get(code))
    .filter((value): value is ValuesScaleResult => Boolean(value));

  const narrativePool = basicResults.filter(
    (result) => result.id !== "face" && result.id !== "humility",
  );
  const strongest = [...narrativePool].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return right.percentile - left.percentile;
  });
  const weakest = [...narrativePool].sort((left, right) => {
    if (left.score !== right.score) {
      return left.score - right.score;
    }

    return left.percentile - right.percentile;
  });

  return {
    higherOrder,
    groups,
    otherValues,
    narrative: {
      strongest: strongest[0] ?? null,
      strongestOthers: strongest.slice(1, 4),
      weakest: weakest[0] ?? null,
      weakestOthers: weakest.slice(1, 4),
    },
  };
}

export function buildValuesBeliefsResults(
  submission: SurveySubmission,
): ValuesBeliefsResults {
  return {
    surveyType: "values-beliefs",
    submission: {
      submissionId: submission.submissionId,
      userId: submission.userId,
      answerCount: submission.answerCount,
      submittedAt: submission.submittedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    },
    answers: submission.answers,
    beliefs: buildBeliefsResults(submission.answers),
    values: buildValuesResults(submission.answers),
  };
}
