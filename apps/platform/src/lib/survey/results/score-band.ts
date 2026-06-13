import { clamp } from "@/lib/survey/results/math";

// The display contract for a scale measurement: how a numeric score maps to a
// band, a percentile rendering, and a 0-50 display value. Shared by every
// scoring engine so band thresholds, percentile bounds, and comparison-group
// wording have a single source of truth.

export type ScoreBand = "Low" | "Middle" | "High";

export type PercentileDirection = "higher" | "lower";

export type PercentileDetails = {
  percentile: number;
  percentileDirection: PercentileDirection;
  percentileMagnitude: number;
  percentileText: string;
};

const PERCENTILE_MIN = 1;
const PERCENTILE_MAX = 99;
const DISPLAY_SCORE_MIN = 0;
const DISPLAY_SCORE_MAX = 50;
const SCORE_BAND_HIGH_MIN = 31;
const SCORE_BAND_LOW_MAX = 19;
const RAW_RESPONSE_MIN = 1;
const RAW_RESPONSE_RANGE = 5;

export function displayScoreFromMean(meanScore: number): number {
  const normalized = ((meanScore - RAW_RESPONSE_MIN) / RAW_RESPONSE_RANGE) * DISPLAY_SCORE_MAX;
  return clamp(Math.round(normalized), DISPLAY_SCORE_MIN, DISPLAY_SCORE_MAX);
}

export function scoreBandFor(displayScore: number): ScoreBand {
  if (displayScore >= SCORE_BAND_HIGH_MIN) return "High";
  if (displayScore <= SCORE_BAND_LOW_MAX) return "Low";
  return "Middle";
}

export function percentileDetailsFor(
  percentile: number,
  comparisonNoun: string,
): PercentileDetails {
  const normalized = clamp(Math.round(percentile), PERCENTILE_MIN, PERCENTILE_MAX);

  if (normalized >= 50) {
    return {
      percentile: normalized,
      percentileDirection: "higher",
      percentileMagnitude: normalized,
      percentileText: `Higher than ${normalized}% of ${comparisonNoun}`,
    };
  }

  const percentileMagnitude = 100 - normalized;
  return {
    percentile: normalized,
    percentileDirection: "lower",
    percentileMagnitude,
    percentileText: `Lower than ${percentileMagnitude}% of ${comparisonNoun}`,
  };
}
