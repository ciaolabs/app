type CompactScore = {
  label: string;
  score: number;
  band: string;
  percentileText: string;
  description?: string;
};

export type PersonalityChatContext = {
  submittedAt: string;
  strongestScore: CompactScore | null;
  strongestPercentile: CompactScore | null;
  lowestScore: CompactScore | null;
  lowestPercentile: CompactScore | null;
  highestTraits: CompactScore[];
  lowestTraits: CompactScore[];
  frameworkOverviews: Array<{
    framework: string;
    metrics: CompactScore[];
  }>;
};

export type ValuesBeliefsChatContext = {
  submittedAt: string;
  beliefs: {
    primary: CompactScore;
    strongest: CompactScore | null;
    weakest: CompactScore | null;
    secondary: CompactScore[];
  };
  values: {
    strongest: CompactScore | null;
    weakest: CompactScore | null;
    higherOrder: CompactScore[];
    groups: Array<{
      group: string;
      summary: CompactScore;
      values: CompactScore[];
    }>;
  };
};

export type SurveyChatContext = {
  personality: PersonalityChatContext | null;
  valuesBeliefs: ValuesBeliefsChatContext | null;
};

export const EMPTY_SURVEY_CHAT_CONTEXT: SurveyChatContext = {
  personality: null,
  valuesBeliefs: null,
};

export function surveyContextHasResults(context: SurveyChatContext) {
  return Boolean(context.personality || context.valuesBeliefs);
}

export function formatSurveyChatContext(context: SurveyChatContext) {
  return JSON.stringify(context, null, 2);
}

export function getSurveyContextAvailability(context: SurveyChatContext) {
  if (context.personality && context.valuesBeliefs) {
    return "personality and values-beliefs";
  }

  if (context.personality) {
    return "personality only";
  }

  if (context.valuesBeliefs) {
    return "values-beliefs only";
  }

  return "none";
}
