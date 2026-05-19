export const API_KEY_PROVIDERS = ["google", "anthropic"] as const;
export type ApiKeyProvider = (typeof API_KEY_PROVIDERS)[number];

export const MODEL_OPTIONS = [
  { value: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", provider: "google" as const },
  { value: "gemini-pro-latest", label: "Gemini Pro Latest", provider: "google" as const },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", provider: "google" as const },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", provider: "anthropic" as const },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic" as const },
] as const;

export type ChatModelValue = (typeof MODEL_OPTIONS)[number]["value"];
export const DEFAULT_CHAT_MODEL: ChatModelValue = "gemini-3.1-flash-lite";

export function getModelOption(value: string) {
  return MODEL_OPTIONS.find((m) => m.value === value) ?? MODEL_OPTIONS[0];
}
