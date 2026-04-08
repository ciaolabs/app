export const SURVEY_SCHEMA_SQL = `
  create table if not exists survey_submissions (
    id uuid primary key,
    user_id text not null,
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
    alter column user_id set not null;

  drop index if exists survey_submissions_one_draft_per_session;
  drop index if exists survey_submissions_session_submitted_idx;

  create unique index if not exists survey_submissions_one_draft_per_user
    on survey_submissions (user_id)
    where status = 'draft';

  create index if not exists survey_submissions_user_submitted_idx
    on survey_submissions (user_id, submitted_at desc)
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
