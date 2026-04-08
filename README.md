# AMBI Survey MVP

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
2. Set `DATABASE_URL` to your Supabase Postgres connection string and keep `SURVEY_STORAGE=postgres`.
3. Add your Clerk keys.
4. Enable GitHub, Google, LinkedIn, and email/password in the Clerk dashboard.
5. Run `pnpm install`.
6. Start the app with `pnpm dev`.

If `DATABASE_URL` is omitted, the app automatically falls back to in-memory storage. That mode is useful for local UI work and automated tests, but it is not durable and should not be used for real survey data.

If the Clerk keys are missing, the public home page still loads and the embedded auth panel shows setup guidance, but protected survey routes will remain unavailable until auth is configured.

## Database

The canonical schema lives in [db/schema.sql](/Volumes/TiaSSD/.CloudStorage/Data/OneDrive-Luiss/Repository/personality-gpt/db/schema.sql). Survey data is stored in:

- `survey_submissions` for draft and submitted survey sessions keyed by the Clerk `user_id`
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
