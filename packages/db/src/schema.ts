export const SURVEY_SCHEMA_VERSION = "2026-04-30";
export const SURVEY_SCORING_VERSION = "2026-04-30";
export const AUTH_PROVIDER = "workos";

export const SHARED_SCHEMA_SQL = `
  create schema if not exists app_private;
  create schema if not exists research;
  create schema if not exists analytics;

  create table if not exists app_private.user_accounts (
    id uuid primary key default gen_random_uuid(),
    provider text not null,
    provider_user_id text not null,
    created_at timestamptz not null default now(),
    last_seen_at timestamptz,
    unique (provider, provider_user_id)
  );

  create table if not exists app_private.chat_threads (
    id uuid primary key default gen_random_uuid(),
    user_account_id uuid not null references app_private.user_accounts(id) on delete cascade,
    title text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create index if not exists app_private_chat_threads_user_updated_idx
    on app_private.chat_threads (user_account_id, updated_at desc);

  create table if not exists app_private.chat_messages (
    id uuid primary key default gen_random_uuid(),
    thread_id uuid not null references app_private.chat_threads(id) on delete cascade,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    created_at timestamptz not null default now()
  );

  create index if not exists app_private_chat_messages_thread_created_idx
    on app_private.chat_messages (thread_id, created_at asc);

  create table if not exists research.participants (
    id uuid primary key default gen_random_uuid(),
    user_account_id uuid references app_private.user_accounts(id) on delete set null,
    public_participant_id text not null unique,
    research_consent boolean not null default false,
    kaggle_export_consent boolean not null default false,
    consent_version text,
    created_at timestamptz not null default now(),
    unique (user_account_id)
  );

  create table if not exists research.consent_events (
    id uuid primary key default gen_random_uuid(),
    participant_id uuid not null references research.participants(id) on delete cascade,
    consent_version text not null,
    research_consent boolean not null,
    kaggle_export_consent boolean not null,
    recorded_at timestamptz not null default now()
  );

  create table if not exists research.surveys (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    created_at timestamptz not null default now()
  );

  create table if not exists research.survey_versions (
    id uuid primary key default gen_random_uuid(),
    survey_id uuid not null references research.surveys(id) on delete cascade,
    version text not null,
    scoring_version text not null,
    status text not null check (status in ('draft', 'published', 'retired')),
    published_at timestamptz,
    retired_at timestamptz,
    unique (survey_id, version)
  );

  create table if not exists research.question_items (
    id uuid primary key default gen_random_uuid(),
    survey_version_id uuid not null references research.survey_versions(id) on delete cascade,
    question_key text not null,
    question_order integer not null,
    prompt text not null,
    response_scale_key text not null,
    construct_key text,
    scale_key text,
    reverse_keyed boolean not null default false,
    source_citation text,
    metadata jsonb not null default '{}'::jsonb,
    unique (survey_version_id, question_key),
    unique (survey_version_id, question_order)
  );

  create table if not exists research.submissions (
    id uuid primary key default gen_random_uuid(),
    public_submission_id text not null unique,
    participant_id uuid not null references research.participants(id),
    survey_version_id uuid not null references research.survey_versions(id),
    status text not null check (status in ('draft', 'submitted', 'voided')),
    answer_count integer not null default 0,
    started_at timestamptz not null default now(),
    submitted_at timestamptz,
    updated_at timestamptz not null default now(),
    client_locale text,
    client_timezone text,
    duration_seconds integer,
    excluded_from_research boolean not null default false,
    exclusion_reason text
  );

  create unique index if not exists research_one_draft_per_participant_survey_version
    on research.submissions (participant_id, survey_version_id)
    where status = 'draft';

  create index if not exists research_submissions_participant_version_submitted_idx
    on research.submissions (participant_id, survey_version_id, submitted_at desc)
    where status = 'submitted';

  create table if not exists research.answers (
    submission_id uuid not null references research.submissions(id) on delete cascade,
    question_item_id uuid not null references research.question_items(id),
    response_value smallint not null check (response_value between 1 and 6),
    answered_at timestamptz not null default now(),
    response_ms integer,
    primary key (submission_id, question_item_id)
  );

  create index if not exists research_answers_submission_question_idx
    on research.answers (submission_id, question_item_id);

  create table if not exists analytics.reference_distributions (
    id uuid primary key default gen_random_uuid(),
    survey_version_id uuid not null references research.survey_versions(id),
    scoring_version text not null,
    score_key text not null,
    source text not null check (source in ('seeded', 'internal_responses', 'published_reference')),
    sample_size integer not null,
    mean numeric,
    standard_deviation numeric,
    median numeric,
    q1 numeric,
    q3 numeric,
    bins jsonb not null,
    generated_at timestamptz not null default now(),
    active_from timestamptz not null default now()
  );

  create table if not exists research.score_results (
    id uuid primary key default gen_random_uuid(),
    submission_id uuid not null references research.submissions(id) on delete cascade,
    scoring_version text not null,
    score_key text not null,
    score_level text not null,
    raw_score numeric,
    normalized_score numeric,
    percentile numeric,
    reference_distribution_id uuid references analytics.reference_distributions(id),
    created_at timestamptz not null default now(),
    unique (submission_id, scoring_version, score_key)
  );

  alter table app_private.user_accounts
    add column if not exists display_name text,
    add column if not exists organization text;

  create table if not exists app_private.user_api_keys (
    id uuid primary key default gen_random_uuid(),
    user_account_id uuid not null references app_private.user_accounts(id) on delete cascade,
    provider text not null check (provider in ('anthropic', 'google')),
    encrypted_key text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_account_id, provider)
  );

  create table if not exists app_private.user_preferences (
    user_account_id uuid primary key references app_private.user_accounts(id) on delete cascade,
    chat_model text not null default 'gemini-2.5-flash',
    updated_at timestamptz not null default now()
  );

  alter table app_private.user_accounts enable row level security;
  alter table app_private.chat_threads enable row level security;
  alter table app_private.chat_messages enable row level security;
  alter table research.participants enable row level security;
  alter table research.consent_events enable row level security;
  alter table research.surveys enable row level security;
  alter table research.survey_versions enable row level security;
  alter table research.question_items enable row level security;
  alter table research.submissions enable row level security;
  alter table research.answers enable row level security;
  alter table research.score_results enable row level security;
  alter table analytics.reference_distributions enable row level security;
  alter table app_private.user_api_keys enable row level security;
  alter table app_private.user_preferences enable row level security;
`;
