export const API_KEY_PROVIDERS = ["google", "anthropic"] as const;
export type ApiKeyProvider = (typeof API_KEY_PROVIDERS)[number];

export const MODEL_OPTIONS = [
  { value: "gemini-flash-lite-latest", label: "Gemini Flash Lite Latest", provider: "google" as const },
  { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash", provider: "google" as const },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", provider: "google" as const },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", provider: "anthropic" as const },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic" as const },
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

export function getModelOption(value: string) {
  return MODEL_OPTIONS.find((m) => m.value === value) ?? MODEL_OPTIONS[0];
}
