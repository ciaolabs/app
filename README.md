# Ciao! Platform

Ciao is a single web app at **platform.ciaobang.com** that helps you understand
yourself through psychology research. It brings together three things you can do,
each one feeding the next:

## What you can do

### 1. Take a survey

Answer research-grade questionnaires and get a scored profile back.

- **Personality** — stable patterns in how you think, feel, and behave, measured
  with the AMBI battery (a blend of eight established personality inventories).
- **Values & beliefs** — what motivates your decisions (Portrait Values
  Questionnaire) and the deep assumptions you hold about what the world is like
  (Primals Inventory).

After every answer a small violin plot shows where your response falls against
others. Your progress autosaves to your account, and once you submit you get a
**dashboard**: ranked scales on a 0–50 scale, percentile bands against a
reference group, and plain-language read-outs. No score is "good" or "bad" —
each profile has its own strengths depending on context.

### 2. Chat about your results

A built-in AI assistant that already knows your survey profile and can pull from
the reference docs to answer questions like *"what does a high score here mean
for how I work with others?"* Conversations are saved as threads so you can pick
them back up. A lightweight assist widget is also available right on the survey
and docs pages for quick questions.

### 3. Read the docs

Reference material explaining each assessment — what it measures, where it comes
from, and how to read your scores. The same content powers the chat assistant's
answers, so what you read and what the assistant tells you stay in sync.

---

## For developers

One Next.js app (`apps/platform`) serves all three surfaces: surveys at the root
(`/`, `/surveys/*`), the chat at `/app`, and the docs at `/docs`.

### Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase Postgres ·
WorkOS AuthKit · Vitest + Playwright.

### Local setup

1. `pnpm install`
2. Copy `apps/platform/.env.example` to `apps/platform/.env.local`.
3. Run `pnpm dev` and open the app.

By default the app runs with `SURVEY_STORAGE=memory` — no database required, good
for UI work and tests, but not durable. For real data, set `DATABASE_URL` to your
Supabase Postgres connection string and `SURVEY_STORAGE=postgres`.

To test signed-in survey flows, add your WorkOS AuthKit keys (`WORKOS_API_KEY`,
`WORKOS_CLIENT_ID`, and a `WORKOS_COOKIE_PASSWORD` from
`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`),
register `http://localhost:3000/callback` as a redirect URI in the WorkOS
dashboard, and enable the providers you want. Without these keys the public pages
still load; protected routes redirect home.

Never commit `.env.local` or any real credentials.

### Scripts

Run from the repo root:

- `pnpm dev` — start the dev server
- `pnpm build` — build the app
- `pnpm lint` — run ESLint
- `pnpm test` — run unit tests

From `apps/platform` (or `pnpm --filter platform <script>`):

- `pnpm test:e2e` — Playwright flow against an in-memory local server
- `pnpm index` — (re)index the docs into DocChunks for chat retrieval (RAG)

### Database

The schema lives in [apps/platform/db/schema.sql](./apps/platform/db/schema.sql)
and is applied automatically on first use, so a fresh Supabase Postgres database
works without a separate migration step. It splits into two schemas:

- `app_private` — account and chat state (`user_accounts`, `chat_threads`, `chat_messages`)
- `research` — survey data (`participants`, `surveys`, `submissions`, `answers`, `score_results`, `consent_events`)

### Notes

- Response plots are seeded demo distributions in this MVP, not real respondent data.
- AMBI item order and question IDs follow Appendix A of Yarkoni (2010); audit
  details are in [docs/ambi-paper-audit.md](./docs/ambi-paper-audit.md).
- Survey, audit, and scoring data committed here are limited to
  public/licensable source material.
