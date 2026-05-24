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
