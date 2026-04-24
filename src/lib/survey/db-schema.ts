export const SURVEY_SCHEMA_SQL = `
  create table if not exists survey_submissions (
    id uuid primary key,
    user_id text not null,
    survey_type text not null default 'personality',
    status text not null check (status in ('draft', 'submitted')),
    answer_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    submitted_at timestamptz
  );

  do $$
  begin
    if exists (
      select 1
      from information_schema.columns
      where table_name = 'survey_submissions' and column_name = 'session_id'
    ) and not exists (
      select 1
      from information_schema.columns
      where table_name = 'survey_submissions' and column_name = 'user_id'
    ) then
      alter table survey_submissions rename column session_id to user_id;
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_name = 'survey_submissions' and column_name = 'session_id'
    ) and exists (
      select 1
      from information_schema.columns
      where table_name = 'survey_submissions' and column_name = 'user_id'
    ) then
      execute '
        update survey_submissions
        set user_id = coalesce(user_id, session_id)
        where user_id is null
      ';
      alter table survey_submissions drop column session_id;
    end if;
  end $$;

  alter table survey_submissions
    add column if not exists survey_type text;

  update survey_submissions
  set survey_type = 'personality'
  where survey_type is null;

  alter table survey_submissions
    alter column user_id set not null;

  alter table survey_submissions
    alter column survey_type set default 'personality';

  alter table survey_submissions
    alter column survey_type set not null;

  drop index if exists survey_submissions_one_draft_per_session;
  drop index if exists survey_submissions_session_submitted_idx;
  drop index if exists survey_submissions_one_draft_per_user;
  drop index if exists survey_submissions_user_submitted_idx;

  do $$
  begin
    if not exists (
      select 1
      from pg_constraint
      where conname = 'survey_submissions_survey_type_check'
    ) then
      alter table survey_submissions
      add constraint survey_submissions_survey_type_check
      check (survey_type in ('personality', 'values-beliefs'));
    end if;
  end $$;

  create unique index if not exists survey_submissions_one_draft_per_user_and_survey
    on survey_submissions (user_id, survey_type)
    where status = 'draft';

  create index if not exists survey_submissions_user_survey_submitted_idx
    on survey_submissions (user_id, survey_type, submitted_at desc)
    where status = 'submitted';

  create table if not exists survey_answers (
    submission_id uuid not null references survey_submissions(id) on delete cascade,
    question_id text not null,
    question_order integer not null,
    response smallint not null check (response between 1 and 6),
    updated_at timestamptz not null default now(),
    primary key (submission_id, question_id)
  );

  create index if not exists survey_answers_submission_order_idx
    on survey_answers (submission_id, question_order);
`;
