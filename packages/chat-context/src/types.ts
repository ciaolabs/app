export type CompactScore = {
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

export type DocChunk = {
  id: string;
  docId: string;
  title: string;
  content: string;
  similarity: number;
  chunkIndex: number;
};
