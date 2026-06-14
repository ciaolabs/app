# ADR-0002: One platform app on platform.ciaobang.com

**Status**: Accepted
**Date**: 2026-06-12

> **Amendment (2026-06-13)**: the chat surface was subsequently moved from
> `/chat` to `/app` (account at `/app/account`); the legacy host redirects were
> retired so `platform.ciaobang.com` is now the only host. The decision below is
> kept as originally recorded.

## Decision

The three apps (`apps/survey` on survey.ciaobang.com, `apps/app` on app.ciaobang.com, `apps/docs` on docs.ciaobang.com) are merged into a single Next.js 16 app, `apps/platform`, served at platform.ciaobang.com:

- Survey pages stay at the root (`/`, `/surveys/*`, `/dashboard`).
- The chat moves under `/chat` (account settings at `/chat/account`).
- The docs (Fumadocs) move under `/docs`.
- Legacy hosts redirect into the platform host via host-conditional redirects in `next.config.ts` (temporary 307s; flip to permanent after the cutover is verified).

Section theming uses the shared `--clay-*` design tokens as the seam: the survey palette is the root default; the chat section re-maps the same token names to its black/white values under `[data-section="chat"]`. A `BodySection` client component mirrors the attribute onto `<body>` so portal-rendered UI inherits the section theme.

## Consequences

- The `/api/internal/survey-context` HMAC endpoint, its CORS allowlist, the secret fallback chain, and both HTTP clients (`survey-context.server.ts` in app and docs) are deleted. The chat loads `SurveyChatContext` by calling `loadSurveyChatContext(userId)` directly (same process, same DB). A small cookie-authenticated `/api/survey-context` route remains only for the chat client's in-browser context refresh.
- The two widget chat routes (survey's and docs' `/api/chat`) merge into one `/api/assist` route (BYOK `x-api-key`, anonymous allowed, optional `pageContent`). The full chat keeps `/api/chat` (server-stored credentials, threads, RAG per ADR-0001).
- One auth surface: a single `/sign-in` (supports `?next=` return paths), one `/callback` (defaults to `/surveys`), one proxy (`src/proxy.ts`). `WORKOS_COOKIE_DOMAIN` is no longer required (host-only cookie).
- Env vars `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SURVEY_URL`, `SURVEY_INTERNAL_URL`, and `SURVEY_CONTEXT_SECRET` are removed.
- Single Vercel project; the three legacy hostnames are attached to it as additional domains so the redirects can fire.
- Docs indexing (`pnpm --filter platform index`) remains an operator task in the merged app.

## Alternatives considered

**Multi-zone** (three deployments, one domain via rewrites + `basePath`) was rejected: it preserves three copies of the duplicated UI/chat code and keeps the cross-app context fetch alive, and the Next 15/16 version split that motivated it was resolved by upgrading survey/app to Next 16.
