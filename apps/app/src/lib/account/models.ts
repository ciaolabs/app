export type ApiKeyProvider = "anthropic" | "google";

export const MODEL_OPTIONS = [
  { value: "gemini-flash-lite-latest", label: "Gemini Flash Lite Latest", provider: "google" as ApiKeyProvider },
  { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash", provider: "google" as ApiKeyProvider },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", provider: "google" as ApiKeyProvider },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", provider: "anthropic" as ApiKeyProvider },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic" as ApiKeyProvider },
] as const;

export type ChatModelValue = (typeof MODEL_OPTIONS)[number]["value"];

export const DEFAULT_CHAT_MODEL: ChatModelValue = "gemini-flash-lite-latest";

/**
 * Reconcile a persisted model id against the current option list. Renamed or
 * removed ids (e.g. after a model-list update) fall back to the default so a
 * stale preference never reaches a route or provider as an invalid model.
 */
export function normalizeModelId(value: string | null | undefined): ChatModelValue {
  return MODEL_OPTIONS.some((m) => m.value === value)
    ? (value as ChatModelValue)
    : DEFAULT_CHAT_MODEL;
}

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
