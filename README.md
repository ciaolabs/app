# Ciao! Platform

A single Next.js application (`apps/platform`, served at `platform.ciaobang.com`) that consolidates the former survey, chat, and docs apps:

- intro page at `/`
- survey chooser at `/surveys`, with the AMBI personality survey at `/surveys/personality`
- legacy `/personalitysurvey` and `/survey` paths preserved as compatibility redirects
- per-question violin plot revealed after every answer
- account-based autosaved drafts plus final submission
- scored dashboards at `/surveys/personality/dashboard` and `/surveys/values-beliefs/dashboard`, with legacy dashboard redirects preserved
- AI chat (threads, RAG over the docs) at `/chat`, account settings at `/chat/account`
- documentation (Fumadocs) at `/docs`
- legacy hosts `survey.`/`app.`/`docs.ciaobang.com` redirect into the platform host (see `apps/platform/next.config.ts`)

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Supabase Postgres via `DATABASE_URL`
- Vitest + Testing Library
- Playwright

## Local setup

1. Copy `apps/platform/.env.example` to `apps/platform/.env.local`.
2. Keep `SURVEY_STORAGE=memory` for local contributor work without a database, or set `DATABASE_URL` to your Supabase Postgres connection string and use `SURVEY_STORAGE=postgres`.
3. Add your WorkOS AuthKit keys (`WORKOS_API_KEY`, `WORKOS_CLIENT_ID`) when you need to test authenticated survey flows. Generate `WORKOS_COOKIE_PASSWORD` via `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
4. In the WorkOS dashboard, add `http://localhost:3000/callback` as an allowed redirect URI and enable the social providers (GitHub, Google, LinkedIn) plus email/password under AuthKit.
5. Run `pnpm install`.
6. Start the app with `pnpm dev`.

Do not commit `.env.local` or any other file containing real credentials. The committed `apps/platform/.env.example` file is intentionally limited to empty placeholders.

If `DATABASE_URL` is omitted, the app automatically falls back to in-memory storage. That mode is useful for local UI work and automated tests, but it is not durable and should not be used for real survey data.

If the WorkOS keys are missing, the public home page still loads, but protected survey routes will redirect to the home page until auth is configured.

## Database

The canonical schema lives in [apps/platform/db/schema.sql](./apps/platform/db/schema.sql) and is applied by `@ciaobang/db`. It is organized into two Postgres schemas:

- `app_private` — account and chat state: `user_accounts`, `chat_threads`, `chat_messages`
- `research` — survey data: `participants`, `surveys`/`survey_versions`, `submissions`, `answers`, `score_results`, `consent_events`

The Postgres client bootstraps these on first use, so a Supabase Postgres database can be used without a separate migration step.

## Scripts

Run from the repo root:

- `pnpm dev` starts the Next.js dev server
- `pnpm build` builds the platform app
- `pnpm lint` runs ESLint
- `pnpm test` runs unit tests with coverage

Run from `apps/platform` (or via `pnpm --filter platform <script>`):

- `pnpm test:e2e` runs the Playwright flow against an in-memory local server
- `pnpm index` (re)indexes the docs content into DocChunks for RAG

## Notes

- Response plots are seeded demo distributions in this MVP, not real respondent microdata.
- The item order and AMBI question IDs are aligned to Appendix A of Yarkoni (2010).
- Appendix-backed AMBI audit details and summary-level exceptions are documented in [docs/ambi-paper-audit.md](./docs/ambi-paper-audit.md).
- Survey item, audit, and scoring data committed to this repository are limited to public/licensable source material intended for contributor visibility.
