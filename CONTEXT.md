# Domain Model

## Core concepts

**Participant** — a user who takes one or more Surveys. Identified by `app_private.user_accounts` via `AUTH_PROVIDER`. Has preferences (chat model) and optional BYOK API keys.

**Survey** — a research instrument with a fixed set of questions, a type (`personality` | `values-beliefs`), and versioning metadata. Defined in code as a `SurveyDefinition`; stored in `research.surveys` / `research.survey_versions`.

**SurveyType** — the discriminant string that identifies which survey (`"personality"`, `"values-beliefs"`). Used as a routing key throughout the system.

**Submission** — a completed (or draft) response by a Participant to a Survey. Stored in `research.submissions`. A Participant may have at most `maxSubmissions` per SurveyType (nullable = unlimited); one may be an active draft at a time.

**SurveyResults** — computed scores derived from a Submission. Includes ranked scale scores, overview metrics, polar scales, and percentile bands. Produced by the scoring engine; stored in `research.score_results`. The display contract — band thresholds, percentile bounds, comparison-group wording, and the 1-6 → 0-50 normalization formula — lives in `score-band.ts` and is shared by the personality and values-beliefs engines so the two cannot drift.

**SurveyChatContext** — a compact, structured summary of a Participant's SurveyResults, shaped for injection into an AI chat system prompt. Contains `personality` and `valuesBeliefs` sub-contexts. Produced by `chat-context-builder`; consumed by the chat system prompt.

**ChatContext** — the full context available to the AI chat module per turn. Currently contains `surveyContext: SurveyChatContext`. Extended by RAG-retrieved DocChunks via tool use (not pre-loaded).

**ChatTurn** — one round-trip in a chat conversation: a Participant's last message in, the assistant's streamed response (with possible tool calls) out, plus side effects on the underlying Thread (find-or-create, persist user + assistant messages). Implemented by `runChatTurn` (live, calls `streamText`) and `runDevChatTurn` (canned stream for local dev). Receives a resolved `LanguageModel` and `SurveyChatContext` — the route owns HTTP, auth, model selection, and context reconciliation; the turn owns the agentic loop and Thread persistence.

**DocChunk** — a piece of authored reference content (from the docs section, `apps/platform/content/docs`) that has been chunked and embedded. Stored in `research.doc_chunks` with a `vector` embedding column. Retrieved dynamically by the `searchDocs` tool during chat.

**RAG Pipeline** — the retrieval pipeline for DocChunks. Steps: query rewriting (personalised using SurveyChatContext) → embedding → pgvector search → reranking (MMR or heuristic, no external service) → return top-k chunks as tool result.

**SurveyLifecycle** — the set of valid state transitions for a Submission, governed by `maxSubmissions`, `submittedCount`, and `hasActiveDraft`. Owned by `checkSurveyAction(definition, status, action)`, a pure function that returns a `LifecycleDecision` (`{ allowed: true }` or `{ allowed: false; reason; message }`). The denial message is owned by the lifecycle module so route handlers cannot copy-drift it. Actions: `start-draft`, `answer`, `submit`.

**DraftStorage** — client-side persistence for in-progress survey answers. Currently `sessionStorage`; abstracted behind a typed adapter so components do not couple to storage mechanics.

## Module vocabulary

- **Module** — anything with an interface and an implementation.
- **Seam** — where an interface lives; a place behaviour can be altered without editing in place.
- **Depth** — leverage at the interface: a lot of behaviour behind a small interface.
- **Adapter** — a concrete thing satisfying an interface at a seam.

## Packages

| Package | Responsibility |
|---|---|
| `packages/db` | Postgres client, schema DDL, schema versioning |
| `packages/auth` | WorkOS authentication, `getCurrentUserId`, auth proxy factory |
| `packages/chat-context` | Shared `SurveyChatContext`, `ChatContext`, `DocChunk` types and utilities |
| `packages/rag` | Embedding, pgvector retrieval, reranking, query rewriting for the RAG pipeline |

## Apps

| App | Responsibility |
|---|---|
| `apps/platform` | The single platform app on platform.ciaobang.com (ADR-0002). Surveys, scoring, and SurveyResults at the root; chat + account under `/app`; docs (Fumadocs, indexed into DocChunks) under `/docs`. |

**Platform sections** — the three user-facing surfaces of `apps/platform`: survey (root), chat (`/app`), docs (`/docs`). Each section is a route subtree with a layout that sets `data-section` for scoped theming; the shared `--clay-*` design tokens are the theming seam (survey palette is the default, sections override token values, not class names).

**Route registry** — `apps/platform/src/lib/routes.ts`, the single source of truth for the platform's in-app URL topology. Two exports for two audiences: `routes` for page navigation (`href`, `<Link>`, `router.push`, `redirect`, `returnPathname`) and `apiRoutes` for `fetch()` endpoints. Static destinations are constants; parameterised ones are functions (`routes.survey(type)`, `apiRoutes.chatThread(id)`). Relocating a surface or adding a basePath is a one-file edit, and links become testable data rather than grep-able literals. The registry deliberately stops at the app boundary: the auth entry point (`/sign-in`, `?next=`) stays in `packages/auth` (its app-agnostic contract); the registry only owns the `returnPathname` the app passes in.

**Assist widget** — the lightweight floating chat (`AiSearchBar`) available on survey and docs pages. Stateless, BYOK from the browser (`x-api-key`), anonymous allowed. On docs pages it sends the current page's text (title + URL + processed markdown, via `getLLMText`) as `pageContent` so answers are page-aware; the docs page publishes it through `AssistPageContentProvider` because the widget lives in the layout and its chat survives navigation. The survey section omits `pageContent`. Served by `/api/assist`. Distinct from the full chat (`/app` + `/api/chat`), which uses server-stored credentials, Threads, and the RAG Pipeline.
