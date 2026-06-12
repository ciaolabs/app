import {
  BELIEFS_RESPONSE_OPTION_LABELS,
  VALUES_RESPONSE_OPTION_LABELS,
  type LikertValue,
  type QuestionItem,
  type QuestionResponseScale,
  type QuestionSection,
} from "@/lib/survey/types";
import {
  PRIMAL_AGGREGATE_ONLY_ITEMS,
  PRIMAL_PRIMARY_REFERENCE,
  PRIMAL_TERTIARY_SCALES,
  PVQ_RR_BASIC_VALUES,
  PVQ_RR_SOURCE_ITEMS,
  type ReferenceScaleStats,
} from "@/lib/survey/values-beliefs-source";

const BELIEFS_SECTION: QuestionSection = {
  id: "beliefs",
  title: "Beliefs",
  shortTitle: "Beliefs",
  eyebrow: "Part 1 of 2",
  description:
    "These statements ask about your beliefs regarding the nature of the world as it really is.",
};

const VALUES_SECTION: QuestionSection = {
  id: "values",
  title: "Values",
  shortTitle: "Values",
  eyebrow: "Part 2 of 2",
  description:
    "These portrait items ask how much each person's priorities and values sound like you.",
};

const BELIEFS_RESPONSE_SCALE: QuestionResponseScale = {
  id: "beliefs-agreement",
  leftAnchor: "Strongly agree",
  rightAnchor: "Strongly disagree",
  options: BELIEFS_RESPONSE_OPTION_LABELS.map((label, index) => ({
    value: (index + 1) as LikertValue,
    label,
  })),
};

const VALUES_RESPONSE_SCALE: QuestionResponseScale = {
  id: "values-portrait",
  leftAnchor: "Not like me at all",
  rightAnchor: "Very much like me",
  options: VALUES_RESPONSE_OPTION_LABELS.map((label, index) => ({
    value: (index + 1) as LikertValue,
    label,
  })),
};

function neutralizePortraitPrompt(prompt: string) {
  return prompt
    .replace(/\bhim\b/g, "them")
    .replace(/\bhis\b/g, "their")
    .replace(/\bhe\b/g, "they")
    .replace(/\bHim\b/g, "Them")
    .replace(/\bHis\b/g, "Their")
    .replace(/\bHe\b/g, "They");
}

type MixtureComponent = {
  mean: number;
  spread: number;
  weight: number;
};

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(maxValue, Math.max(minValue, value));
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function gaussian(rating: number, mean: number, spread: number) {
  return Math.exp(-((rating - mean) ** 2) / (2 * spread ** 2));
}

function buildDistributionFromMixture(
  components: MixtureComponent[],
  total: number,
  floor: number,
  seed: number,
) {
  const weights = Array.from({ length: 6 }, (_, index) => {
    const rating = index + 1;
    const mixture = components.reduce(
      (sum, component) => sum + component.weight * gaussian(rating, component.mean, component.spread),
      0,
    );
    const ripple = 0.012 * Math.sin((seed % 19) + rating * 1.31);

    return Math.max(floor + mixture + ripple, floor / 2);
  });
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  const counts = weights.map((value) => Math.max(1, Math.round((value / weightSum) * total)));
  const difference = total - counts.reduce((sum, value) => sum + value, 0);
  const targetIndex = counts.indexOf(Math.max(...counts));

  counts[targetIndex] += difference;

  return counts;
}

function likertMeanFromDisplayScore(score: number) {
  return 1 + score / 10;
}

function seededQuestionDistribution(params: {
  seedKey: string;
  mean: number;
  spread: number;
  floor?: number;
}) {
  const seed = hashString(params.seedKey);
  const meanJitter = (((seed >> 4) % 13) - 6) / 55;
  const spreadJitter = (((seed >> 10) % 9) - 4) / 100;
  const shoulderJitter = (((seed >> 15) % 9) - 4) / 100;
  const total = 260 + ((seed >> 20) % 120);
  const center = clamp(params.mean + meanJitter, 1.2, 5.8);
  const spread = clamp(params.spread + spreadJitter, 0.72, 1.45);
  const shoulderOffset = center >= 3.5 ? -0.52 : 0.52;

  return buildDistributionFromMixture(
    [
      { mean: center, spread, weight: 1 },
      {
        mean: clamp(center + shoulderOffset + shoulderJitter, 1.1, 5.9),
        spread: clamp(spread + 0.18, 0.8, 1.55),
        weight: 0.18,
      },
    ],
    total,
    params.floor ?? 0.04,
    seed,
  );
}

function beliefQuestionMean(reference: ReferenceScaleStats, reverse: boolean) {
  const keyedMean = likertMeanFromDisplayScore(reference.mean);
  return reverse ? keyedMean : 7 - keyedMean;
}

function beliefQuestionDistribution(params: {
  itemNumber: number;
  prompt: string;
  reverse: boolean;
  reference: ReferenceScaleStats;
}) {
  const floor = params.reference.mean <= 12 || params.reference.mean >= 38 ? 0.028 : 0.04;

  return seededQuestionDistribution({
    seedKey: `belief-${params.itemNumber}-${params.prompt}`,
    mean: beliefQuestionMean(params.reference, params.reverse),
    spread: clamp(params.reference.sd / 9.2, 0.78, 1.36),
    floor,
  });
}

function valueQuestionDistribution(params: {
  itemNumber: number;
  prompt: string;
  reference: ReferenceScaleStats;
}) {
  return seededQuestionDistribution({
    seedKey: `value-${params.itemNumber}-${params.prompt}`,
    mean: likertMeanFromDisplayScore(params.reference.mean),
    spread: clamp(params.reference.sd / 9.8, 0.8, 1.32),
    floor: params.reference.mean <= 22 || params.reference.mean >= 42 ? 0.03 : 0.042,
  });
}

function getTertiaryScale(code: string) {
  const match = PRIMAL_TERTIARY_SCALES.find((scale) => scale.code === code);

  if (!match) {
    throw new Error(`Missing primal tertiary scale: ${code}`);
  }

  return match;
}

const INTERESTING_SCALE = getTertiaryScale("interesting");
const BEAUTIFUL_SCALE = getTertiaryScale("beautiful");
const VALUE_REFERENCE_BY_ITEM_NUMBER = new Map(
  PVQ_RR_BASIC_VALUES.flatMap((value) =>
    value.itemNumbers.map((itemNumber) => [itemNumber, value.reference] as const),
  ),
);

const beliefQuestionItems = [
  ...PRIMAL_TERTIARY_SCALES.flatMap((scale) =>
    scale.prompts.map((prompt, index) => ({
      number: scale.itemNumbers[index],
      prompt,
      reverse: scale.reverseItemNumbers.includes(scale.itemNumbers[index]),
      reference: scale.reference,
    })),
  ),
  ...PRIMAL_AGGREGATE_ONLY_ITEMS.map((item) => ({
    number: item.number,
    prompt: item.prompt,
    reverse: item.reverse,
    reference:
      item.number === 97
        ? PRIMAL_PRIMARY_REFERENCE
        : item.number === 98
          ? INTERESTING_SCALE.reference
          : BEAUTIFUL_SCALE.reference,
  })),
]
  .sort((left, right) => left.number - right.number)
  .map<QuestionItem>((item, index) => ({
    id: `PWB${item.number.toString().padStart(2, "0")}`,
    order: index + 1,
    prompt: item.prompt,
    responseScale: BELIEFS_RESPONSE_SCALE,
    section: BELIEFS_SECTION,
    visual: {
      kind: "violin",
      distribution: beliefQuestionDistribution({
        itemNumber: item.number,
        prompt: item.prompt,
        reverse: item.reverse,
        reference: item.reference,
      }),
      title: "Response pattern",
    },
  }));

const valueQuestionItems = PVQ_RR_SOURCE_ITEMS.map<QuestionItem>((prompt, index) => {
  const itemNumber = index + 1;
  const reference = VALUE_REFERENCE_BY_ITEM_NUMBER.get(itemNumber);

  if (!reference) {
    throw new Error(`Missing PVQ-RR reference stats for item ${itemNumber}.`);
  }

  return {
    id: `PVQ${itemNumber.toString().padStart(2, "0")}`,
    order: beliefQuestionItems.length + index + 1,
    prompt: neutralizePortraitPrompt(prompt),
    responseScale: VALUES_RESPONSE_SCALE,
    section: VALUES_SECTION,
    visual: {
      kind: "violin",
      distribution: valueQuestionDistribution({
        itemNumber,
        prompt,
        reference,
      }),
      title: "Response pattern",
    },
  };
});

export const valuesBeliefsSurveyQuestions: readonly QuestionItem[] = [
  ...beliefQuestionItems,
  ...valueQuestionItems,
];

export const VALUES_BELIEFS_QUESTION_IDS = new Set(
  valuesBeliefsSurveyQuestions.map((question) => question.id),
);
