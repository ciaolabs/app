# Ciao! Survey

A greenfield Next.js 15 application for phase one of the AMBI personality survey flow:

- intro page at `/`
- 181-item survey experience at `/personalitysurvey` (with `/survey` preserved as a compatibility redirect)
- per-question violin plot revealed after every answer
- account-based autosaved drafts plus final submission
- scored dashboard at `/personalitysurvey/dashboard` (with `/dashboard` preserved as a compatibility redirect)

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS v4
- Supabase Postgres via `DATABASE_URL`
- Vitest + Testing Library
- Playwright

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Keep `SURVEY_STORAGE=memory` for local contributor work without a database, or set `DATABASE_URL` to your Supabase Postgres connection string and use `SURVEY_STORAGE=postgres`.
3. Add your WorkOS AuthKit keys (`WORKOS_API_KEY`, `WORKOS_CLIENT_ID`) when you need to test authenticated survey flows. Generate `WORKOS_COOKIE_PASSWORD` via `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
4. In the WorkOS dashboard, add `http://localhost:3000/callback` as an allowed redirect URI and enable the social providers (GitHub, Google, LinkedIn) plus email/password under AuthKit.
5. Run `pnpm install`.
6. Start the app with `pnpm dev`.

Do not commit `.env.local` or any other file containing real credentials. The committed `.env.example` file is intentionally limited to empty placeholders.

If `DATABASE_URL` is omitted, the app automatically falls back to in-memory storage. That mode is useful for local UI work and automated tests, but it is not durable and should not be used for real survey data.

If the WorkOS keys are missing, the public home page still loads, but protected survey routes will redirect to the home page until auth is configured.

## Database

The canonical schema lives in [db/schema.sql](./db/schema.sql). Survey data is stored in:

- `survey_submissions` for draft and submitted survey sessions keyed by the WorkOS `user_id`
- `survey_answers` for one normalized row per answered question per submission

The Postgres repository bootstraps these tables automatically on first use, so a Supabase Postgres database can be used without a separate migration step.

## Scripts

- `pnpm dev` starts the Next.js dev server
- `pnpm lint` runs ESLint
- `pnpm test` runs unit tests with coverage
- `pnpm test:e2e` runs the Playwright flow against an in-memory local server

## Notes

- Response plots are seeded demo distributions in this MVP, not real respondent microdata.
- The item order and AMBI question IDs are aligned to Appendix A of Yarkoni (2010).
- Appendix-backed AMBI audit details and summary-level exceptions are documented in [docs/ambi-paper-audit.md](./docs/ambi-paper-audit.md).
- Survey item, audit, and scoring data committed to this repository are limited to public/licensable source material intended for contributor visibility.
