import {
  MODEL_OPTIONS,
  normalizeModelId,
  type ApiKeyProvider,
  type ChatModelValue,
} from "@/lib/ai-models";

// The model list and id-normalization live in a single source of truth so the
// "assist" seam (AiSearchBar widget + /api/assist) and the "full chat" seam
// (chat-shell + /api/chat + /api/account/preferences) can never drift apart.
// This module re-exports them and adds the chat-only BYOK logic on top.
export {
  DEFAULT_CHAT_MODEL,
  MODEL_OPTIONS,
  normalizeModelId,
} from "@/lib/ai-models";
export type { ApiKeyProvider, ChatModelValue } from "@/lib/ai-models";

/**
 * Pick the model to actually run given the providers the user has keys for.
 * Prefers the requested model; if its provider has no key, falls back to the
 * first option whose provider is available. Returns null only when the user
 * has no usable key at all. Shared by the chat route (server) and the model
 * picker (client) so the displayed model always matches the one that runs.
 */
export function resolveUsableModel(
  preferred: string | null | undefined,
  providers: Record<ApiKeyProvider, boolean>,
): ChatModelValue | null {
  const requested = normalizeModelId(preferred);
  const requestedOption = MODEL_OPTIONS.find((m) => m.value === requested)!;
  if (providers[requestedOption.provider]) return requested;
  const fallback = MODEL_OPTIONS.find((m) => providers[m.provider]);
  return fallback ? fallback.value : null;
}
