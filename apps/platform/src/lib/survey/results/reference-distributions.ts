import {
  SURVEY_SCHEMA_VERSION,
  SURVEY_SCORING_VERSION,
  getReadyDb,
  type Sql,
} from "@ciaobang/db";

import { type QuestionItem, type SurveyType } from "@/lib/survey/types";

/**
 * Reference distributions derived from real user responses.
 *
 * The survey engine and the per-question violin plots are driven by a
 * six-bin distribution for every question (counts of responses 1..6). By
 * default those bins are synthetic (see `seededDistributionFor`). This module
 * lets a monthly batch recompute the bins from the responses users actually
 * submitted (`research.answers`) and persist them to
 * `analytics.reference_distributions` with `source = 'internal_responses'`.
 *
 * The read path ({@link loadInternalQuestionDistributions}) returns those bins
 * so the engine/UI can reflect real input. Questions with fewer than
 * {@link MIN_SAMPLE_SIZE} responses are omitted so callers fall back to the
 * seeded distribution until enough data accumulates — otherwise a handful of
 * early submissions would produce a spiky, misleading violin.
 */

/** Below this many submitted responses a question keeps its seeded distribution. */
export const MIN_SAMPLE_SIZE = 30;

export type QuestionDistributionMap = Map<string, number[]>;

export type ReferenceDistributionSet = {
  /** Stable token identifying this distribution set, used for cache keys. */
  version: string;
  /** questionId -> six-bin response counts (index 0 = rating 1). */
  distributions: QuestionDistributionMap;
};

export const SEEDED_DISTRIBUTION_SET: ReferenceDistributionSet = {
  version: "seeded",
  distributions: new Map(),
};

type RecomputeRow = { score_key: string; survey_version_id: string; sample_size: number };

export type RecomputeSummary = {
  questionsUpdated: number;
  totalResponses: number;
};

/**
 * Recompute per-question response distributions from every submitted, non-excluded
 * response and replace the stored `internal_responses` reference distributions.
 *
 * Idempotent: each run clears the previous internal rows and writes a fresh set
 * inside a single transaction. Intended to run on a monthly cron.
 */
export async function recomputeReferenceDistributions(
  sqlClient?: Sql,
): Promise<RecomputeSummary> {
  const sql = sqlClient ?? (await getReadyDb());

  const rows = await sql.begin(async (tx) => {
    await tx`
      delete from analytics.reference_distributions
      where source = 'internal_responses'
    `;

    return tx<RecomputeRow[]>`
      insert into analytics.reference_distributions (
        survey_version_id,
        scoring_version,
        score_key,
        source,
        sample_size,
        mean,
        standard_deviation,
        median,
        q1,
        q3,
        bins
      )
      select
        q.survey_version_id,
        ${SURVEY_SCORING_VERSION},
        q.question_key,
        'internal_responses',
        count(a.*)::int as sample_size,
        avg(a.response_value),
        coalesce(stddev_pop(a.response_value), 0),
        percentile_cont(0.5) within group (order by a.response_value),
        percentile_cont(0.25) within group (order by a.response_value),
        percentile_cont(0.75) within group (order by a.response_value),
        jsonb_build_object(
          'counts',
          jsonb_build_array(
            count(*) filter (where a.response_value = 1),
            count(*) filter (where a.response_value = 2),
            count(*) filter (where a.response_value = 3),
            count(*) filter (where a.response_value = 4),
            count(*) filter (where a.response_value = 5),
            count(*) filter (where a.response_value = 6)
          )
        )
      from research.answers a
      join research.submissions s on s.id = a.submission_id
      join research.question_items q on q.id = a.question_item_id
      where s.status = 'submitted'
        and s.excluded_from_research = false
      group by q.survey_version_id, q.question_key
      returning score_key, survey_version_id, sample_size
    `;
  });

  return {
    questionsUpdated: rows.length,
    totalResponses: rows.reduce((sum, row) => sum + Number(row.sample_size), 0),
  };
}

type DistributionRow = {
  score_key: string;
  sample_size: number;
  counts: number[] | null;
  generated_at: string | Date;
};

function normalizeCounts(counts: number[] | null): number[] | null {
  if (!counts || counts.length !== 6) {
    return null;
  }

  const numeric = counts.map((value) => Number(value) || 0);

  return numeric.some((value) => value > 0) ? numeric : null;
}

/**
 * Load the internal (real-response) per-question distributions for a survey,
 * keeping only questions that have reached {@link MIN_SAMPLE_SIZE}. Questions
 * below the threshold are omitted so callers fall back to their seeded bins.
 */
export async function loadInternalQuestionDistributions(
  surveyType: SurveyType,
  sqlClient?: Sql,
): Promise<ReferenceDistributionSet> {
  const sql = sqlClient ?? (await getReadyDb());

  const rows = await sql<DistributionRow[]>`
    select
      rd.score_key,
      rd.sample_size,
      rd.bins->'counts' as counts,
      rd.generated_at
    from analytics.reference_distributions rd
    join research.survey_versions sv on sv.id = rd.survey_version_id
    join research.surveys svy on svy.id = sv.survey_id
    where svy.slug = ${surveyType}
      and rd.source = 'internal_responses'
      and sv.version = ${SURVEY_SCHEMA_VERSION}
      and rd.sample_size >= ${MIN_SAMPLE_SIZE}
  `;

  const distributions: QuestionDistributionMap = new Map();
  let latestGeneratedAt = 0;

  for (const row of rows) {
    const counts = normalizeCounts(row.counts);

    if (!counts) {
      continue;
    }

    distributions.set(row.score_key, counts);
    const generatedAt = new Date(row.generated_at).getTime();

    if (Number.isFinite(generatedAt)) {
      latestGeneratedAt = Math.max(latestGeneratedAt, generatedAt);
    }
  }

  if (distributions.size === 0) {
    return SEEDED_DISTRIBUTION_SET;
  }

  return {
    version: `internal:${surveyType}:${latestGeneratedAt}:${distributions.size}`,
    distributions,
  };
}

/**
 * Best-effort loader for request paths: never throws (a DB hiccup should not
 * break the dashboard), falling back to the seeded distributions.
 */
export async function loadInternalQuestionDistributionsSafe(
  surveyType: SurveyType,
): Promise<ReferenceDistributionSet> {
  try {
    return await loadInternalQuestionDistributions(surveyType);
  } catch {
    return SEEDED_DISTRIBUTION_SET;
  }
}

/**
 * Overlay real-response bins onto the per-question violin distributions so the
 * survey UI shows how people actually answered. Questions without an internal
 * distribution (below the min-sample threshold) keep their seeded bins.
 */
export function applyReferenceDistributions(
  questions: readonly QuestionItem[],
  set: ReferenceDistributionSet,
): QuestionItem[] {
  if (set.distributions.size === 0) {
    return [...questions];
  }

  return questions.map((question) => {
    const counts = set.distributions.get(question.id);

    if (!counts || question.visual?.kind !== "violin") {
      return question;
    }

    return {
      ...question,
      visual: { ...question.visual, distribution: counts },
    };
  });
}
