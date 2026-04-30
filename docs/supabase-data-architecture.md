# Supabase Data Architecture

This architecture was implemented on the live Supabase project `Ciao Survey Prod` on 2026-04-30.
Before the migration, production had two public tables:

- `survey_submissions`: 8 rows, one row per draft or submitted survey.
- `survey_answers`: 1192 rows, one row per answered question.

The current model is good enough for saving drafts and rendering a user's own dashboard, but it
does not yet preserve enough context for a durable research dataset, cohort comparisons, versioned
scoring, or anonymized Kaggle exports.

## Goals

1. Keep the product fast and simple for logged-in users.
2. Preserve survey, question, and scoring versions so old responses remain interpretable.
3. Separate identity data from research response data.
4. Store raw answers and derived scores so future dashboards can compare a new user against real
   collected responses instead of seeded or simulated distributions.
5. Make Kaggle export safe by construction: no names, emails, provider user IDs, exact timestamps,
   IP addresses, or small-cell sensitive demographic combinations.

## Current Risks

- `survey_submissions.user_id` stores the auth/provider user identifier directly beside response
  metadata.
- Questions are identified only by text IDs such as `A10`; the submitted row does not say which
  survey definition version or scoring version produced the dashboard.
- Answers store only the raw response. That is good, but there is no durable question table to join
  against for public dataset documentation.
- RLS is enabled on both public tables, but no policies currently exist. If browser-side Supabase
  access is added later, the tables should not be readable until policies are explicitly designed.
- The app currently creates schema through `SURVEY_SCHEMA_SQL`, so any database redesign needs an
  application migration plan too.

## Recommended Schema

Use three conceptual areas:

- `app_private`: identity, provider IDs, account-level data. Never exported.
- `research`: versioned survey definitions, submissions, answers, scores, consent, and exportable
  respondent IDs.
- `analytics`: materialized summaries and reference distributions used by dashboards.

Supabase exposes `public` by default, so prefer keeping sensitive tables outside `public` unless
there is a concrete reason to expose them through the Supabase Data API.

```sql
create schema if not exists app_private;
create schema if not exists research;
create schema if not exists analytics;

create table app_private.user_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_user_id text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  unique (provider, provider_user_id)
);

create table research.participants (
  id uuid primary key default gen_random_uuid(),
  user_account_id uuid references app_private.user_accounts(id) on delete set null,
  public_participant_id text not null unique,
  research_consent boolean not null default false,
  kaggle_export_consent boolean not null default false,
  consent_version text,
  created_at timestamptz not null default now()
);

create table research.consent_events (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references research.participants(id) on delete cascade,
  consent_version text not null,
  research_consent boolean not null,
  kaggle_export_consent boolean not null,
  recorded_at timestamptz not null default now()
);

create table research.surveys (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  created_at timestamptz not null default now()
);

create table research.survey_versions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references research.surveys(id),
  version text not null,
  scoring_version text not null,
  status text not null check (status in ('draft', 'published', 'retired')),
  published_at timestamptz,
  retired_at timestamptz,
  unique (survey_id, version)
);

create table research.question_items (
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

create table research.submissions (
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

create unique index research_one_draft_per_participant_survey_version
  on research.submissions (participant_id, survey_version_id)
  where status = 'draft';

create table research.answers (
  submission_id uuid not null references research.submissions(id) on delete cascade,
  question_item_id uuid not null references research.question_items(id),
  response_value smallint not null check (response_value between 1 and 6),
  answered_at timestamptz not null default now(),
  response_ms integer,
  primary key (submission_id, question_item_id)
);

create table research.score_results (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references research.submissions(id) on delete cascade,
  scoring_version text not null,
  score_key text not null,
  score_level text not null,
  raw_score numeric,
  normalized_score numeric,
  percentile numeric,
  reference_distribution_id uuid,
  created_at timestamptz not null default now(),
  unique (submission_id, scoring_version, score_key)
);

create table analytics.reference_distributions (
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
```

## Dashboard Comparison Flow

1. Save raw answers in `research.answers`.
2. On submit, compute scale and overview scores into `research.score_results`.
3. Periodically refresh `analytics.reference_distributions` from eligible submitted responses:
   `status = 'submitted'`, consent granted, not excluded, enough sample size.
4. Dashboard percentiles should compare the user's score to the active internal distribution when
   sample size is sufficient. Until then, keep using seeded or published references and label them
   clearly.

Minimum sample-size rule:

- Below 30 eligible submissions: use current seeded/reference distribution.
- 30 to 99 submissions: show real internal comparison but mark it as early.
- 100+ submissions: use real internal comparison as the default.

## Kaggle Export Shape

Publish a derived export view or job output, not the app tables directly.

Suggested files:

- `participants.csv`: `public_participant_id`, broad age band, broad region if collected, language,
  consent flags relevant to research use.
- `submissions.csv`: public submission ID, public participant ID, survey slug, survey version, month
  or quarter submitted, answer count, duration bucket.
- `answers.csv`: public submission ID, question key, question order, response value.
- `questions.csv`: survey slug, survey version, question key, order, prompt, response scale,
  construct, reverse-keyed flag, citation.
- `scores.csv`: public submission ID, scoring version, score key, score level, raw score,
  normalized score, percentile computed against a stated reference distribution.
- `data_dictionary.md`: methods, consent basis, exclusion rules, missing-data rules, and license.

Do not export:

- auth provider IDs, names, emails, usernames, IP addresses, user agents, exact timestamps,
  free-text fields, or raw location.
- demographic columns where a category has fewer than a safe minimum count, for example `k < 10`.

If demographics are collected later, store them in a separate `research.participant_demographics`
table using broad, pre-defined categories. Avoid free text for research fields unless there is a
specific review process for de-identification.

## Migration Plan

1. Add the new schemas and version tables.
2. Backfill `research.surveys`, `research.survey_versions`, and `research.question_items` from the
   current TypeScript survey definitions.
3. Create `app_private.user_accounts` and `research.participants`, mapping current
   `survey_submissions.user_id` values to private user accounts and generated
   `public_participant_id` values.
4. Backfill current submitted and draft rows into `research.submissions` and `research.answers`.
5. Update application storage code to read and write the new tables.
6. Add score persistence on submit.
7. Add analytics refresh SQL or a scheduled job for reference distributions.
8. Keep legacy tables read-only during the transition, then retire them after export verification.

## RLS Direction

If the app continues to access Postgres only from server routes using `DATABASE_URL`, keep direct
client access closed and use database roles carefully.

If browser-side Supabase access is introduced later:

- Keep `app_private` non-exposed.
- Enable RLS on `research` and `analytics`.
- Let authenticated users read only their own submissions through `participant_id`.
- Let users insert/update only drafts for themselves.
- Do not let users read raw aggregate response tables directly; expose only safe aggregate views or
  server endpoints.
- Create views with `security_invoker = true` on Postgres 15+ when views are exposed.
