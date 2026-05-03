# Domain Model

## Core concepts

**Participant** — a user who takes one or more Surveys. Identified by `app_private.user_accounts` via `AUTH_PROVIDER`. Has preferences (chat model) and optional BYOK API keys.

**Survey** — a research instrument with a fixed set of questions, a type (`personality` | `values-beliefs`), and versioning metadata. Defined in code as a `SurveyDefinition`; stored in `research.surveys` / `research.survey_versions`.

**SurveyType** — the discriminant string that identifies which survey (`"personality"`, `"values-beliefs"`). Used as a routing key throughout the system.

**Submission** — a completed (or draft) response by a Participant to a Survey. Stored in `research.submissions`. A Participant may have at most `maxSubmissions` per SurveyType (nullable = unlimited); one may be an active draft at a time.

**SurveyResults** — computed scores derived from a Submission. Includes ranked scale scores, overview metrics, polar scales, and percentile bands. Produced by the scoring engine; stored in `research.score_results`.

**SurveyChatContext** — a compact, structured summary of a Participant's SurveyResults, shaped for injection into an AI chat system prompt. Contains `personality` and `valuesBeliefs` sub-contexts. Produced by `chat-context-builder`; consumed by the chat system prompt.

**ChatContext** — the full context available to the AI chat module per turn. Currently contains `surveyContext: SurveyChatContext`. Extended by RAG-retrieved DocChunks via tool use (not pre-loaded).

**DocChunk** — a piece of authored reference content (from `apps/docs`) that has been chunked and embedded. Stored in `research.doc_chunks` with a `vector` embedding column. Retrieved dynamically by the `searchDocs` tool during chat.

**RAG Pipeline** — the retrieval pipeline for DocChunks. Steps: query rewriting (personalised using SurveyChatContext) → embedding → pgvector search → reranking (MMR or heuristic, no external service) → return top-k chunks as tool result.

**SurveyLifecycle** — the set of valid state transitions for a Submission: can-draft?, can-answer?, can-submit?. Governed by `maxSubmissions`, `submittedCount`, and `hasActiveDraft`. Should be a pure function, not embedded in route handlers.

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
| `packages/auth` | WorkOS authentication, `getCurrentUserId` |
| `packages/chat-context` | Shared `SurveyChatContext`, `ChatContext`, `DocChunk` types and utilities |
| `packages/rag` | Embedding, pgvector retrieval, reranking, query rewriting for the RAG pipeline |

## Apps

| App | Responsibility |
|---|---|
| `apps/survey` | Survey taking, scoring, SurveyResults computation, SurveyChatContext building |
| `apps/app` | Chat UI, account settings, AI model routing, RAG tool host |
| `apps/docs` | Authored reference content (MDX), indexed into DocChunks at build time |
| `apps/auth` | Auth provider adapter |
