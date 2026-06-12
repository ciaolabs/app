import { getActiveSurveyDefinition, type ActiveSurveyDefinition } from "@/lib/survey/definitions";
import {
  AUTH_PROVIDER,
  SURVEY_SCHEMA_VERSION,
  SURVEY_SCORING_VERSION,
  getReadyDb,
  type Sql,
} from "@ciaobang/db";
import {
  SurveyAnswers,
  SurveyDraft,
  SurveyRepository,
  SurveySubmission,
  SurveySubmissionSummary,
  SurveyType,
} from "@/lib/survey/types";

type SubmissionRow = {
  id: string;
  user_id: string;
  survey_type: SurveyType;
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
  survey_type: SurveyType;
  answer_count: number;
  created_at: string | Date;
  updated_at: string | Date;
  submitted_at: string | Date;
};

type DraftIdRow = {
  id: string;
};

type IdRow = {
  id: string;
};

type SurveyStatusRow = {
  submitted_count: number;
  has_active_draft: boolean;
  active_draft_answer_count: number | null;
  latest_submission_at: string | Date | null;
  latest_submission_id: string | null;
};

type QuestionInsertRow = {
  survey_version_id: string;
  question_key: string;
  question_order: number;
  prompt: string;
  response_scale_key: string;
};

type SurveyContext = {
  participantId: string;
  surveyVersionId: string;
};

const catalogReady = new Map<SurveyType, Promise<string>>();

type SqlExecutor = Sql;

function publicId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

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
    surveyType: row.survey_type,
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
    surveyType: row.survey_type,
    answerCount: row.answer_count,
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIsoString(row.updated_at) ?? new Date().toISOString(),
    submittedAt: toIsoString(row.submitted_at) ?? new Date().toISOString(),
  };
}

async function ensureSurveyCatalog(sql: SqlExecutor, definition: ActiveSurveyDefinition) {
  const cached = catalogReady.get(definition.type);

  if (cached) {
    return cached;
  }

  const ready = (async () => {
    const [survey] = await sql<IdRow[]>`
      insert into research.surveys (slug, title)
      values (${definition.type}, ${definition.title})
      on conflict (slug) do update
      set title = excluded.title
      returning id
    `;

    if (!survey) {
      throw new Error(`Unable to load survey catalog row for ${definition.type}.`);
    }

    const [surveyVersion] = await sql<IdRow[]>`
      insert into research.survey_versions (
        survey_id,
        version,
        scoring_version,
        status,
        published_at
      )
      values (
        ${survey.id},
        ${SURVEY_SCHEMA_VERSION},
        ${SURVEY_SCORING_VERSION},
        'published',
        now()
      )
      on conflict (survey_id, version) do update
      set
        scoring_version = excluded.scoring_version,
        status = excluded.status,
        published_at = coalesce(research.survey_versions.published_at, excluded.published_at)
      returning id
    `;

    if (!surveyVersion) {
      throw new Error(`Unable to load survey version for ${definition.type}.`);
    }

    const questionRows: QuestionInsertRow[] = definition.questions.map((question) => ({
      survey_version_id: surveyVersion.id,
      question_key: question.id,
      question_order: question.order,
      prompt: question.prompt,
      response_scale_key: question.responseScale.id,
    }));

    if (questionRows.length > 0) {
      await sql`
        insert into research.question_items ${sql(
          questionRows,
          "survey_version_id",
          "question_key",
          "question_order",
          "prompt",
          "response_scale_key",
        )}
        on conflict (survey_version_id, question_key)
        do update set
          question_order = excluded.question_order,
          prompt = excluded.prompt,
          response_scale_key = excluded.response_scale_key
      `;
    }

    return surveyVersion.id;
  })();

  catalogReady.set(definition.type, ready);
  return ready;
}

async function ensureParticipantId(sql: SqlExecutor, userId: string) {
  const [account] = await sql<IdRow[]>`
    insert into app_private.user_accounts (provider, provider_user_id, last_seen_at)
    values (${AUTH_PROVIDER}, ${userId}, now())
    on conflict (provider, provider_user_id)
    do update set last_seen_at = excluded.last_seen_at
    returning id
  `;

  if (!account) {
    throw new Error("Unable to load the user account.");
  }

  const [participant] = await sql<IdRow[]>`
    insert into research.participants (user_account_id, public_participant_id)
    values (${account.id}, ${publicId("participant")})
    on conflict (user_account_id)
    do update set user_account_id = excluded.user_account_id
    returning id
  `;

  if (!participant) {
    throw new Error("Unable to load the research participant.");
  }

  return participant.id;
}

async function ensureContext(
  sql: SqlExecutor,
  userId: string,
  surveyType: SurveyType,
): Promise<SurveyContext> {
  const definition = getActiveSurveyDefinition(surveyType);

  if (!definition) {
    throw new Error("This survey is not available.");
  }

  const [participantId, surveyVersionId] = await Promise.all([
    ensureParticipantId(sql, userId),
    ensureSurveyCatalog(sql, definition),
  ]);

  return { participantId, surveyVersionId };
}

async function selectDraft(sql: SqlExecutor, userId: string, context: SurveyContext) {
  const rows = await sql<SubmissionRow[]>`
    select
      s.id,
      ua.provider_user_id as user_id,
      svy.slug as survey_type,
      s.status,
      s.answer_count,
      s.started_at as created_at,
      s.updated_at,
      s.submitted_at,
      coalesce(
        jsonb_object_agg(q.question_key, a.response_value) filter (where q.question_key is not null),
        '{}'::jsonb
      ) as answers
    from research.submissions s
    join research.participants p on p.id = s.participant_id
    join app_private.user_accounts ua on ua.id = p.user_account_id
    join research.survey_versions sv on sv.id = s.survey_version_id
    join research.surveys svy on svy.id = sv.survey_id
    left join research.answers a on a.submission_id = s.id
    left join research.question_items q on q.id = a.question_item_id
    where
      s.participant_id = ${context.participantId}
      and s.survey_version_id = ${context.surveyVersionId}
      and s.status = 'draft'
      and ua.provider_user_id = ${userId}
    group by s.id, ua.provider_user_id, svy.slug
    limit 1
  `;

  return rows[0] ? (toSurveyRecord(rows[0]) as SurveyDraft) : null;
}

async function selectDraftId(sql: SqlExecutor, context: SurveyContext, submissionId?: string) {
  const rows = submissionId
    ? await sql<DraftIdRow[]>`
        select id
        from research.submissions
        where
          id = ${submissionId}
          and participant_id = ${context.participantId}
          and survey_version_id = ${context.surveyVersionId}
          and status = 'draft'
        limit 1
      `
    : await sql<DraftIdRow[]>`
        select id
        from research.submissions
        where
          participant_id = ${context.participantId}
          and survey_version_id = ${context.surveyVersionId}
          and status = 'draft'
        limit 1
      `;

  return rows[0]?.id ?? null;
}

async function ensureDraftId(sql: SqlExecutor, context: SurveyContext, submissionId?: string) {
  let draftId = await selectDraftId(sql, context, submissionId);

  if (draftId) {
    return draftId;
  }

  if (submissionId) {
    throw new Error("Unable to load the active draft.");
  }

  await sql`
    insert into research.submissions (
      id,
      public_submission_id,
      participant_id,
      survey_version_id,
      status,
      answer_count
    )
    values (
      ${crypto.randomUUID()},
      ${publicId("submission")},
      ${context.participantId},
      ${context.surveyVersionId},
      'draft',
      0
    )
    on conflict do nothing
  `;

  draftId = await selectDraftId(sql, context);

  if (!draftId) {
    throw new Error("Unable to load the active draft.");
  }

  return draftId;
}

async function selectLatestSubmission(sql: SqlExecutor, userId: string, context: SurveyContext) {
  const rows = await sql<SubmissionRow[]>`
    select
      s.id,
      ua.provider_user_id as user_id,
      svy.slug as survey_type,
      s.status,
      s.answer_count,
      s.started_at as created_at,
      s.updated_at,
      s.submitted_at,
      coalesce(
        jsonb_object_agg(q.question_key, a.response_value) filter (where q.question_key is not null),
        '{}'::jsonb
      ) as answers
    from research.submissions s
    join research.participants p on p.id = s.participant_id
    join app_private.user_accounts ua on ua.id = p.user_account_id
    join research.survey_versions sv on sv.id = s.survey_version_id
    join research.surveys svy on svy.id = sv.survey_id
    left join research.answers a on a.submission_id = s.id
    left join research.question_items q on q.id = a.question_item_id
    where
      s.participant_id = ${context.participantId}
      and s.survey_version_id = ${context.surveyVersionId}
      and s.status = 'submitted'
      and ua.provider_user_id = ${userId}
    group by s.id, ua.provider_user_id, svy.slug
    order by s.submitted_at desc
    limit 1
  `;

  return rows[0] ? (toSurveyRecord(rows[0]) as SurveySubmission) : null;
}

async function selectSubmissionById(
  sql: SqlExecutor,
  userId: string,
  context: SurveyContext,
  submissionId: string,
) {
  const rows = await sql<SubmissionRow[]>`
    select
      s.id,
      ua.provider_user_id as user_id,
      svy.slug as survey_type,
      s.status,
      s.answer_count,
      s.started_at as created_at,
      s.updated_at,
      s.submitted_at,
      coalesce(
        jsonb_object_agg(q.question_key, a.response_value) filter (where q.question_key is not null),
        '{}'::jsonb
      ) as answers
    from research.submissions s
    join research.participants p on p.id = s.participant_id
    join app_private.user_accounts ua on ua.id = p.user_account_id
    join research.survey_versions sv on sv.id = s.survey_version_id
    join research.surveys svy on svy.id = sv.survey_id
    left join research.answers a on a.submission_id = s.id
    left join research.question_items q on q.id = a.question_item_id
    where
      s.id = ${submissionId}
      and s.participant_id = ${context.participantId}
      and s.survey_version_id = ${context.surveyVersionId}
      and s.status = 'submitted'
      and ua.provider_user_id = ${userId}
    group by s.id, ua.provider_user_id, svy.slug
    limit 1
  `;

  return rows[0] ? (toSurveyRecord(rows[0]) as SurveySubmission) : null;
}

async function selectSubmissionSummaries(sql: SqlExecutor, userId: string, context: SurveyContext) {
  const rows = await sql<SubmissionSummaryRow[]>`
    select
      s.id,
      ua.provider_user_id as user_id,
      svy.slug as survey_type,
      s.answer_count,
      s.started_at as created_at,
      s.updated_at,
      s.submitted_at
    from research.submissions s
    join research.participants p on p.id = s.participant_id
    join app_private.user_accounts ua on ua.id = p.user_account_id
    join research.survey_versions sv on sv.id = s.survey_version_id
    join research.surveys svy on svy.id = sv.survey_id
    where
      s.participant_id = ${context.participantId}
      and s.survey_version_id = ${context.surveyVersionId}
      and s.status = 'submitted'
      and ua.provider_user_id = ${userId}
    order by s.submitted_at desc
  `;

  return rows.map(toSubmissionSummary);
}

async function selectSurveyStatus(
  sql: SqlExecutor,
  surveyType: SurveyType,
  context: SurveyContext,
) {
  const [row] = await sql<SurveyStatusRow[]>`
    select
      count(*) filter (where status = 'submitted')::int as submitted_count,
      coalesce(bool_or(status = 'draft'), false) as has_active_draft,
      coalesce(max(answer_count) filter (where status = 'draft'), 0)::int as active_draft_answer_count,
      max(submitted_at) filter (where status = 'submitted') as latest_submission_at,
      (array_agg(id order by submitted_at desc) filter (where status = 'submitted'))[1]::text as latest_submission_id
    from research.submissions
    where
      participant_id = ${context.participantId}
      and survey_version_id = ${context.surveyVersionId}
  `;

  return {
    surveyType,
    submittedCount: row?.submitted_count ?? 0,
    hasActiveDraft: row?.has_active_draft ?? false,
    activeDraftAnswerCount: row?.active_draft_answer_count ?? 0,
    latestSubmissionAt: toIsoString(row?.latest_submission_at ?? null),
    latestSubmissionId: row?.latest_submission_id ?? null,
  };
}

export function createPostgresSurveyRepository(): SurveyRepository {
  return {
    async ensureDraft(userId, surveyType) {
      const sql = await getReadyDb();
      const context = await ensureContext(sql, userId, surveyType);
      const existing = await selectDraft(sql, userId, context);

      if (existing) {
        return existing;
      }

      try {
        await sql`
          insert into research.submissions (
            id,
            public_submission_id,
            participant_id,
            survey_version_id,
            status,
            answer_count
          )
          values (
            ${crypto.randomUUID()},
            ${publicId("submission")},
            ${context.participantId},
            ${context.surveyVersionId},
            'draft',
            0
          )
        `;
      } catch (error) {
        const postgresError = error as { code?: string };

        if (postgresError.code !== "23505") {
          throw error;
        }
      }

      const draft = await selectDraft(sql, userId, context);

      if (!draft) {
        throw new Error("Unable to create or load the current survey draft.");
      }

      return draft;
    },

    async getDraft(userId, surveyType) {
      const sql = await getReadyDb();
      const context = await ensureContext(sql, userId, surveyType);
      return selectDraft(sql, userId, context);
    },

    async upsertAnswer({ userId, surveyType, submissionId, questionId, questionOrder, value }) {
      const sql = await getReadyDb();
      const context = await ensureContext(sql, userId, surveyType);
      const draftId = await ensureDraftId(sql, context, submissionId);

      const inserted = await sql<IdRow[]>`
        insert into research.answers (submission_id, question_item_id, response_value, answered_at)
        select ${draftId}, q.id, ${value}, now()
        from research.question_items q
        where
          q.survey_version_id = ${context.surveyVersionId}
          and q.question_key = ${questionId}
          and q.question_order = ${questionOrder}
        on conflict (submission_id, question_item_id)
        do update set
          response_value = excluded.response_value,
          answered_at = excluded.answered_at
        returning question_item_id as id
      `;

      if (inserted.length === 0) {
        throw new Error(`Unknown question id: ${questionId}`);
      }

      await sql`
        update research.submissions
        set
          answer_count = (
            select count(*)::int
            from research.answers
            where submission_id = ${draftId}
          ),
          updated_at = now()
        where id = ${draftId}
      `;

      const refreshedDraft = await selectDraft(sql, userId, context);

      if (!refreshedDraft) {
        throw new Error("Unable to refresh the active draft.");
      }

      return refreshedDraft;
    },

    async submitDraft({ userId, surveyType, answers }) {
      const definition = getActiveSurveyDefinition(surveyType);

      if (!definition) {
        throw new Error("This survey is not available for submissions.");
      }

      if (Object.keys(answers).length !== definition.questionCount) {
        throw new Error(`Expected ${definition.questionCount} answers before submitting.`);
      }

      const sql = await getReadyDb();
      const context = await ensureContext(sql, userId, surveyType);
      const draftId = await ensureDraftId(sql, context);

      await sql`
        delete from research.answers
        where submission_id = ${draftId}
      `;

      for (const [questionId, value] of Object.entries(answers)) {
        const question = definition.questionsById.get(questionId);

        if (!question) {
          throw new Error(`Unknown question id: ${questionId}`);
        }

        await sql`
          insert into research.answers (submission_id, question_item_id, response_value)
          select ${draftId}, q.id, ${value}
          from research.question_items q
          where
            q.survey_version_id = ${context.surveyVersionId}
            and q.question_key = ${questionId}
            and q.question_order = ${question.order}
        `;
      }

      await sql`
        update research.submissions
        set
          status = 'submitted',
          answer_count = ${definition.questionCount},
          updated_at = now(),
          submitted_at = now()
        where id = ${draftId}
      `;

      const submission = await selectSubmissionById(sql, userId, context, draftId);

      if (!submission) {
        throw new Error("Unable to load the submitted survey.");
      }

      return submission;
    },

    async getLatestSubmission(userId, surveyType) {
      const sql = await getReadyDb();
      const context = await ensureContext(sql, userId, surveyType);
      return selectLatestSubmission(sql, userId, context);
    },

    async getSubmissionById(userId, surveyType, submissionId) {
      const sql = await getReadyDb();
      const context = await ensureContext(sql, userId, surveyType);
      return selectSubmissionById(sql, userId, context, submissionId);
    },

    async listSubmissions(userId, surveyType) {
      const sql = await getReadyDb();
      const context = await ensureContext(sql, userId, surveyType);
      return selectSubmissionSummaries(sql, userId, context);
    },

    async getSurveyStatus(userId, surveyType) {
      const sql = await getReadyDb();
      const context = await ensureContext(sql, userId, surveyType);
      return selectSurveyStatus(sql, surveyType, context);
    },
  };
}
