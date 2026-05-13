# ADR-0001: RAG tool requires the participant Google key

**Status**: Revised
**Date**: 2026-05-03
**Revised**: 2026-05-13

## Decision

The `searchDocs` RAG tool is registered for a chat session only when the Participant has configured a Google API key via BYOK.

The same Google AI Studio key used for Gemini chat is also used to embed documentation search queries. There is no server-level `RAG_GOOGLE_API_KEY` fallback in the app chat route.

## Reasoning

- Ask Ciao should share the same Ciao Docs knowledge base as the documentation site.
- The participant's Google AI Studio key can be used for both Gemini generation and Gemini embeddings.
- Using the participant key keeps embedding costs and authorization attached to the user who brought the key.
- Users who choose Anthropic without also saving a Google key can still chat, but the docs retrieval tool is not available for that session.

## Consequences

- `makeSearchDocsTool` takes an explicit `googleApiKey: string` parameter rather than reading from env.
- The chat route checks only the participant's saved Google key before registering `searchDocs`.
- `tools` is still conditionally populated, so local/dev environments can run without a vector database or embedding key.
- The Ciao Docs indexing script still accepts a local `RAG_GOOGLE_API_KEY` or `GOOGLE_API_KEY` for admin reindexing, because indexing is an operator task rather than a participant chat turn.
