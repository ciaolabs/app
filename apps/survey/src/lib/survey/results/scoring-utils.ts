/**
 * scoring-utils.ts
 *
 * Shared primitives used by both scoring engines (engine.ts and
 * values-beliefs-engine.ts). Keep this file free of domain-specific types so
 * it can be imported by either engine without creating circular dependencies.
 */

import { displayScoreFromMean } from "@/lib/survey/results/score-band";

// ---------------------------------------------------------------------------
// Comparison-group nouns
// ---------------------------------------------------------------------------

/**
 * Noun used when describing percentile comparisons for personality survey
 * results (e.g. "Higher than 72% of people").
 */
export const PERSONALITY_COMPARISON_NOUN = "people";

/**
 * Noun used when describing percentile comparisons for values & beliefs survey
 * results (e.g. "Higher than 72% of reference respondents").
 */
export const VALUES_BELIEFS_COMPARISON_NOUN = "reference respondents";

// ---------------------------------------------------------------------------
// IQR constant
// ---------------------------------------------------------------------------

/**
 * The z-score at the 25th (and, by symmetry, 75th) percentile of the standard
 * normal distribution.  Multiply by a standard deviation to get the offset
 * from the mean that covers the interquartile range:
 *
 *   iqrOffset = IQR_Z_SCORE * sd
 *   iqrStart  = mean - iqrOffset
 *   iqrEnd    = mean + iqrOffset
 */
export const IQR_Z_SCORE = 0.67448975;

// ---------------------------------------------------------------------------
// Item-value helpers
// ---------------------------------------------------------------------------

/**
 * Returns the keyed (possibly reversed) value for a single Likert response.
 *
 * Both engines use a 1–6 response scale where a reversed item maps rawValue r
 * to 7 − r so that high raw scores always indicate high construct endorsement.
 *
 * @param rawValue - The raw 1–6 response value.
 * @param reverse  - Whether to reverse-score the item.
 */
export function keyedItemValue(rawValue: number, reverse: boolean): number {
  return reverse ? 7 - rawValue : rawValue;
}

// ---------------------------------------------------------------------------
// Display-score helper
// ---------------------------------------------------------------------------

/**
 * Converts a sum of keyed item values into a 0–50 display score by first
 * computing the mean and then delegating to `displayScoreFromMean`.
 *
 * @param sum       - Sum of all keyed item values for the scale.
 * @param itemCount - Number of items that contributed to the sum.
 */
export function displayScoreFromKeyedSum(sum: number, itemCount: number): number {
  return displayScoreFromMean(sum / itemCount);
}

// ---------------------------------------------------------------------------
// Sort comparator builders
// ---------------------------------------------------------------------------

/**
 * A minimal shape that both `ScaleResult` and `ValuesScaleResult` satisfy for
 * the purpose of ranking comparators.
 */
type RankableResult = {
  score: number;
  percentile: number;
  displayName?: string;
  label?: string;
};

/** Returns a stable display name for any rankable result. */
function rankableName(result: RankableResult): string {
  return result.displayName ?? result.label ?? "";
}

/**
 * Comparator: descending by score, then descending by percentile as a
 * tie-breaker, then ascending by name.  Used for "highest-score" rankings in
 * the personality engine and for the values engine's strongest-values sort.
 */
export function compareByScoreDesc(left: RankableResult, right: RankableResult): number {
  if (right.score !== left.score) return right.score - left.score;
  if (right.percentile !== left.percentile) return right.percentile - left.percentile;
  return rankableName(left).localeCompare(rankableName(right));
}

/**
 * Comparator: ascending by score, then ascending by percentile as a
 * tie-breaker, then ascending by name.  Used for "lowest-score" rankings in
 * the personality engine and for the values engine's weakest-values sort.
 */
export function compareByScoreAsc(left: RankableResult, right: RankableResult): number {
  if (left.score !== right.score) return left.score - right.score;
  if (left.percentile !== right.percentile) return left.percentile - right.percentile;
  return rankableName(left).localeCompare(rankableName(right));
}

/**
 * Comparator: descending by percentile, then descending by score as a
 * tie-breaker, then ascending by name.  Used for "highest-percentile"
 * rankings in the personality engine and for the beliefs engine's strongest-
 * beliefs sort.
 */
export function compareByPercentileDesc(left: RankableResult, right: RankableResult): number {
  if (right.percentile !== left.percentile) return right.percentile - left.percentile;
  if (right.score !== left.score) return right.score - left.score;
  return rankableName(left).localeCompare(rankableName(right));
}

/**
 * Comparator: ascending by percentile, then ascending by score as a
 * tie-breaker, then ascending by name.  Used for "lowest-percentile"
 * rankings in the personality engine.
 */
export function compareByPercentileAsc(left: RankableResult, right: RankableResult): number {
  if (left.percentile !== right.percentile) return left.percentile - right.percentile;
  if (left.score !== right.score) return left.score - right.score;
  return rankableName(left).localeCompare(rankableName(right));
}
