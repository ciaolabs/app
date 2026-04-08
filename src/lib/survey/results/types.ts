import { SurveyAnswers, SurveySubmission, SurveySubmissionSummary } from "@/lib/survey/types";

export const INVENTORY_CODES = [
  "NEO",
  "HEXACO",
  "MPQ",
  "CPI",
  "JPIR",
  "6FPQ",
  "TCI",
  "HPI",
] as const;

export type InventoryCode = (typeof INVENTORY_CODES)[number];

export type ScoreBand = "Low" | "Middle" | "High";

export type PercentileDirection = "higher" | "lower";

export type KeyedItemDefinition = {
  order: number;
  reverse: boolean;
};

export type ScaleDefinition = {
  code: string;
  scaleNo: number;
  inventoryCode: InventoryCode;
  inventoryLabel: string;
  name: string;
  key: string;
  keyedItems: KeyedItemDefinition[];
  convergentCorrelation: number | null;
  alphaGa: number | null;
  alphaOriginal: number | null;
};

export type ScaleResult = {
  code: string;
  scaleNo: number;
  inventoryCode: InventoryCode;
  inventoryLabel: string;
  name: string;
  displayName: string;
  description: string;
  keyedItemCount: number;
  score: number;
  meanScore: number;
  percentile: number;
  percentileDirection: PercentileDirection;
  percentileMagnitude: number;
  percentileText: string;
  band: ScoreBand;
  reliability: {
    convergentCorrelation: number | null;
    alphaGa: number | null;
    alphaOriginal: number | null;
  };
};

export type OverviewMetricDefinition = {
  id: string;
  label: string;
  description: string;
  scaleNumbers: number[];
  scoreOffset?: number;
};

export type FrameworkSectionDefinition = {
  id: string;
  title: string;
  description?: string;
  scaleNumbers: number[];
};

export type FrameworkResultLayout = "gauges" | "ranked-list";

export type FrameworkDefinition = {
  id: InventoryCode;
  tabLabel: string;
  heading: string;
  methodology: string;
  intro: string;
  readMoreHref: string;
  layout: FrameworkResultLayout;
  overview: OverviewMetricDefinition[];
  sections: FrameworkSectionDefinition[];
};

export type OverviewMetricResult = {
  id: string;
  label: string;
  description: string;
  score: number;
  median: number;
  iqrStart: number;
  iqrEnd: number;
  percentile: number;
  percentileDirection: PercentileDirection;
  percentileMagnitude: number;
  percentileText: string;
  band: ScoreBand;
};

export type FrameworkSectionResult = {
  id: string;
  title: string;
  description?: string;
  items: ScaleResult[];
};

export type FrameworkResult = {
  id: InventoryCode;
  tabLabel: string;
  heading: string;
  methodology: string;
  intro: string;
  readMoreHref: string;
  layout: FrameworkResultLayout;
  overview: OverviewMetricResult[];
  sections: FrameworkSectionResult[];
};

export type RankedScaleResult = {
  rank: number;
  code: string;
  scaleNo: number;
  inventoryCode: InventoryCode;
  inventoryLabel: string;
  name: string;
  displayName: string;
  description: string;
  score: number;
  percentile: number;
  percentileDirection: PercentileDirection;
  percentileMagnitude: number;
  percentileText: string;
  band: ScoreBand;
};

export type SurveyResults = {
  submission: Pick<
    SurveySubmission,
    "submissionId" | "userId" | "answerCount" | "submittedAt" | "createdAt" | "updatedAt"
  >;
  answers: SurveyAnswers;
  frameworks: FrameworkResult[];
  ranked: {
    highestByScore: RankedScaleResult[];
    lowestByScore: RankedScaleResult[];
    highestByPercentile: RankedScaleResult[];
    lowestByPercentile: RankedScaleResult[];
  };
  narrative: {
    strongestScore: RankedScaleResult | null;
    strongestPercentile: RankedScaleResult | null;
    strongestOthers: RankedScaleResult[];
    lowestScore: RankedScaleResult | null;
    lowestPercentile: RankedScaleResult | null;
    lowestOthers: RankedScaleResult[];
  };
};

export type ResultsPayload = {
  results: SurveyResults | null;
  submissions?: SurveySubmissionSummary[];
  selectedSubmissionId?: string | null;
  error?: string;
};
