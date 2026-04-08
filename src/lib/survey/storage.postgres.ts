import postgres from "postgres";

import { QUESTION_COUNT, QUESTION_LOOKUP } from "@/lib/survey/questions";
import { SURVEY_SCHEMA_SQL } from "@/lib/survey/db-schema";
import {
  SurveyAnswers,
  SurveyDraft,
  SurveyRepository,
  SurveySubmission,
  SurveySubmissionSummary,
} from "@/lib/survey/types";

type SubmissionRow = {
  id: string;
  user_id: string;
  status: "draft" | "submitted";
  answer_count: number;
  created_at: string | Date;
  updated_at: string | Date;
  submitted_at: string | Date | null;
  answers: SurveyAnswers | null;
};

type SubmissionSummaryRow = {
  id: string;
  user_id: string;
  answer_count: number;
  created_at: string | Date;
  updated_at: string | Date;
  submitted_at: string | Date;
};

let client: ReturnType<typeof postgres> | null = null;
let schemaReady: Promise<void> | null = null;

function getClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for postgres survey storage.");
  }

  if (!client) {
    client = postgres(process.env.DATABASE_URL, {
      max: 1,
      prepare: false,
    });
  }

  return client;
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getClient().unsafe(SURVEY_SCHEMA_SQL).then(() => undefined);
  }

  return schemaReady;
}

type SqlExecutor = postgres.Sql;

function toIsoString(value: string | Date | null) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.toISOString();
}

function toSurveyRecord(row: SubmissionRow): SurveyDraft | SurveySubmission {
  const answers = Object.fromEntries(
    Object.entries(row.answers ?? {}).map(([questionId, value]) => [
      questionId,
      Number(value),
    ]),
  ) as SurveyAnswers;

  return {
    submissionId: row.id,
    userId: row.user_id,
    status: row.status,
    answerCount: row.answer_count,
    answers,
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIsoString(row.updated_at) ?? new Date().toISOString(),
    submittedAt: toIsoString(row.submitted_at),
  } as SurveyDraft | SurveySubmission;
}

function toSubmissionSummary(row: SubmissionSummaryRow): SurveySubmissionSummary {
  return {
    submissionId: row.id,
    userId: row.user_id,
    answerCount: row.answer_count,
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIsoString(row.updated_at) ?? new Date().toISOString(),
    submittedAt: toIsoString(row.submitted_at) ?? new Date().toISOString(),
  };
}

async function selectDraft(sql: SqlExecutor, userId: string) {
  const rows = await sql<SubmissionRow[]>`
    select
      s.id,
      s.user_id,
      s.status,
      s.answer_count,
      s.created_at,
      s.updated_at,
      s.submitted_at,
      coalesce(
        jsonb_object_agg(a.question_id, a.response) filter (where a.question_id is not null),
        '{}'::jsonb
      ) as answers
    from survey_submissions s
    left join survey_answers a on a.submission_id = s.id
    where s.user_id = ${userId} and s.status = 'draft'
    group by s.id
    limit 1
  `;

  return rows[0] ? (toSurveyRecord(rows[0]) as SurveyDraft) : null;
}

async function selectLatestSubmission(sql: SqlExecutor, userId: string) {
  const rows = await sql<SubmissionRow[]>`
    select
      s.id,
      s.user_id,
      s.status,
      s.answer_count,
      s.created_at,
      s.updated_at,
      s.submitted_at,
      coalesce(
        jsonb_object_agg(a.question_id, a.response) filter (where a.question_id is not null),
        '{}'::jsonb
      ) as answers
    from survey_submissions s
    left join survey_answers a on a.submission_id = s.id
    where s.user_id = ${userId} and s.status = 'submitted'
    group by s.id
    order by s.submitted_at desc
    limit 1
  `;

  return rows[0] ? (toSurveyRecord(rows[0]) as SurveySubmission) : null;
}

async function selectSubmissionById(sql: SqlExecutor, userId: string, submissionId: string) {
  const rows = await sql<SubmissionRow[]>`
    select
      s.id,
      s.user_id,
      s.status,
      s.answer_count,
      s.created_at,
      s.updated_at,
      s.submitted_at,
      coalesce(
        jsonb_object_agg(a.question_id, a.response) filter (where a.question_id is not null),
        '{}'::jsonb
      ) as answers
    from survey_submissions s
    left join survey_answers a on a.submission_id = s.id
    where s.user_id = ${userId} and s.id = ${submissionId} and s.status = 'submitted'
    group by s.id
    limit 1
  `;

  return rows[0] ? (toSurveyRecord(rows[0]) as SurveySubmission) : null;
}

async function selectSubmissionSummaries(sql: SqlExecutor, userId: string) {
  const rows = await sql<SubmissionSummaryRow[]>`
    select
      s.id,
      s.user_id,
      s.answer_count,
      s.created_at,
      s.updated_at,
      s.submitted_at
    from survey_submissions s
    where s.user_id = ${userId} and s.status = 'submitted'
    order by s.submitted_at desc
  `;

  return rows.map(toSubmissionSummary);
}

export function createPostgresSurveyRepository(): SurveyRepository {
  return {
    async ensureDraft(userId) {
      await ensureSchema();
      const sql = getClient();
      const existing = await selectDraft(sql, userId);

      if (existing) {
        return existing;
      }

      try {
        await sql`
          insert into survey_submissions (id, user_id, status, answer_count)
          values (${crypto.randomUUID()}, ${userId}, 'draft', 0)
        `;
      } catch (error) {
        const postgresError = error as { code?: string };

        if (postgresError.code !== "23505") {
          throw error;
        }
      }

      const draft = await selectDraft(sql, userId);

      if (!draft) {
        throw new Error("Unable to create or load the current survey draft.");
      }

      return draft;
    },

    async getDraft(userId) {
      await ensureSchema();
      return selectDraft(getClient(), userId);
    },

    async upsertAnswer({ userId, questionId, questionOrder, value }) {
      await ensureSchema();
      const sql = getClient();

      return sql.begin(async (transaction) => {
        const tx = transaction as unknown as postgres.Sql;
        let draft = await selectDraft(tx, userId);

        if (!draft) {
          await tx`
            insert into survey_submissions (id, user_id, status, answer_count)
            values (${crypto.randomUUID()}, ${userId}, 'draft', 0)
            on conflict do nothing
          `;
          draft = await selectDraft(tx, userId);
        }

        if (!draft) {
          throw new Error("Unable to load the active draft.");
        }

        await tx`
          insert into survey_answers (submission_id, question_id, question_order, response, updated_at)
          values (${draft.submissionId}, ${questionId}, ${questionOrder}, ${value}, now())
          on conflict (submission_id, question_id)
          do update set
            response = excluded.response,
            question_order = excluded.question_order,
            updated_at = now()
        `;

        const [{ count }] = await tx<{ count: number }[]>`
          select count(*)::int as count
          from survey_answers
          where submission_id = ${draft.submissionId}
        `;

        await tx`
          update survey_submissions
          set answer_count = ${count}, updated_at = now()
          where id = ${draft.submissionId}
        `;

        const refreshedDraft = await selectDraft(tx, userId);

        if (!refreshedDraft) {
          throw new Error("Unable to refresh the active draft.");
        }

        return refreshedDraft;
      });
    },

    async submitDraft({ userId, answers }) {
      if (Object.keys(answers).length !== QUESTION_COUNT) {
        throw new Error(`Expected ${QUESTION_COUNT} answers before submitting.`);
      }

      await ensureSchema();
      const sql = getClient();

      return sql.begin(async (transaction) => {
        const tx = transaction as unknown as postgres.Sql;
        let draft = await selectDraft(tx, userId);

        if (!draft) {
          await tx`
            insert into survey_submissions (id, user_id, status, answer_count)
            values (${crypto.randomUUID()}, ${userId}, 'draft', 0)
            on conflict do nothing
          `;
          draft = await selectDraft(tx, userId);
        }

        if (!draft) {
          throw new Error("Unable to load the draft for submission.");
        }

        await tx`
          delete from survey_answers
          where submission_id = ${draft.submissionId}
        `;

        for (const [questionId, value] of Object.entries(answers)) {
          const question = QUESTION_LOOKUP.get(questionId);

          if (!question) {
            throw new Error(`Unknown question id: ${questionId}`);
          }

          await tx`
            insert into survey_answers (submission_id, question_id, question_order, response, updated_at)
            values (${draft.submissionId}, ${questionId}, ${question.order}, ${value}, now())
          `;
        }

        await tx`
          update survey_submissions
          set
            status = 'submitted',
            answer_count = ${QUESTION_COUNT},
            updated_at = now(),
            submitted_at = now()
          where id = ${draft.submissionId}
        `;

        const submission = await selectLatestSubmission(tx, userId);

        if (!submission) {
          throw new Error("Unable to load the submitted survey.");
        }

        return submission;
      });
    },

    async getLatestSubmission(userId) {
      await ensureSchema();
      return selectLatestSubmission(getClient(), userId);
    },

    async getSubmissionById(userId, submissionId) {
      await ensureSchema();
      return selectSubmissionById(getClient(), userId, submissionId);
    },

    async listSubmissions(userId) {
      await ensureSchema();
      return selectSubmissionSummaries(getClient(), userId);
    },
  };
}
