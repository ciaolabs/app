# ADR-0001: RAG tool activates only with BYOK Google key

**Status**: Accepted  
**Date**: 2026-05-03

## Decision

The `searchDocs` RAG tool is only registered for a chat session when the Participant has configured a Google API key via BYOK. There is no system-level embedding key. The app is fully functional without it — the LLM answers from `SurveyChatContext` alone.

## Reasoning

- Embedding cost is not trivial at scale; routing it through the user's key keeps infrastructure costs predictable.
- RAG is an enhancement, not a core feature. The chat experience without document retrieval is already useful.
- Requiring a Google key for basic chat would reduce adoption.

## Consequences

- `makeSearchDocsTool` takes an explicit `googleApiKey: string` parameter rather than reading from env.
- The chat route checks for a Google key at request time; `tools` is conditionally populated.
- The system prompt should not mention document search when the tool is absent.
- Future: if a system-level embedding key is ever added, this ADR should be revisited — don't add one silently.
