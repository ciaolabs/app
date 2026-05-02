import {
  SurveyAnswers,
  SurveySubmission,
  SurveySubmissionSummary,
  SurveyType,
} from "@/lib/survey/types";

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

export type PersonalitySurveyResults = {
  surveyType: "personality";
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

export type ReferenceDistribution = {
  mean: number;
  sd: number;
  iqrStart: number;
  iqrEnd: number;
};

export type PolarScaleResult = {
  id: string;
  label: string;
  description: string;
  lowLabel: string;
  highLabel: string;
  score: number;
  percentile: number;
  percentileDirection: PercentileDirection;
  percentileMagnitude: number;
  percentileText: string;
  comparisonLabel: string;
  comparisonText: string;
  reference: ReferenceDistribution;
  band: ScoreBand;
};

export type ValuesScaleResult = {
  id: string;
  label: string;
  description: string;
  score: number;
  percentile: number;
  percentileDirection: PercentileDirection;
  percentileMagnitude: number;
  percentileText: string;
  reference: ReferenceDistribution;
  band: ScoreBand;
};

export type BeliefsResultTab = {
  overview: PolarScaleResult[];
  primary: PolarScaleResult;
  secondary: PolarScaleResult[];
  tertiaryGroups: Array<{
    id: string;
    title: string;
    description?: string;
    items: PolarScaleResult[];
  }>;
  neutralPrimals: PolarScaleResult[];
  narrative: {
    strongest: PolarScaleResult | null;
    strongestOthers: PolarScaleResult[];
    weakest: PolarScaleResult | null;
    weakestOthers: PolarScaleResult[];
  };
};

export type ValuesResultTab = {
  higherOrder: ValuesScaleResult[];
  groups: Array<{
    id: string;
    title: string;
    description: string;
    summary: ValuesScaleResult;
    items: ValuesScaleResult[];
  }>;
  otherValues: ValuesScaleResult[];
  narrative: {
    strongest: ValuesScaleResult | null;
    strongestOthers: ValuesScaleResult[];
    weakest: ValuesScaleResult | null;
    weakestOthers: ValuesScaleResult[];
  };
};

export type ValuesBeliefsResults = {
  surveyType: "values-beliefs";
  submission: Pick<
    SurveySubmission,
    "submissionId" | "userId" | "answerCount" | "submittedAt" | "createdAt" | "updatedAt"
  >;
  answers: SurveyAnswers;
  beliefs: BeliefsResultTab;
  values: ValuesResultTab;
};

export type SurveyResults = PersonalitySurveyResults;
export type AnySurveyResults = PersonalitySurveyResults | ValuesBeliefsResults;

export type ResultsPayload<TResults extends AnySurveyResults = AnySurveyResults> = {
  results: TResults | null;
  submissions?: SurveySubmissionSummary[];
  selectedSubmissionId?: string | null;
  error?: string;
};

export type ResultsPayloadBySurveyType = {
  [Type in SurveyType]: ResultsPayload<
    Type extends "personality" ? PersonalitySurveyResults : ValuesBeliefsResults
  >;
};
