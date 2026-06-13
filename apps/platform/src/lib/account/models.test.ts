import { describe, expect, it } from "vitest";

import {
  DEFAULT_CHAT_MODEL,
  MODEL_OPTIONS,
  normalizeModelId,
  resolveUsableModel,
} from "./models";

const anthropicModel = MODEL_OPTIONS.find((m) => m.provider === "anthropic")!.value;
const googleModel = MODEL_OPTIONS.find((m) => m.provider === "google")!.value;

describe("normalizeModelId", () => {
  it("keeps a currently-valid model id unchanged", () => {
    for (const option of MODEL_OPTIONS) {
      expect(normalizeModelId(option.value)).toBe(option.value);
    }
  });

  it("falls back to the default for renamed or removed model ids", () => {
    // ids that existed before the model-list rename and no longer exist
    expect(normalizeModelId("gemini-3.1-flash-lite")).toBe(DEFAULT_CHAT_MODEL);
    expect(normalizeModelId("gemini-pro-latest")).toBe(DEFAULT_CHAT_MODEL);
    expect(normalizeModelId("gemini-2.5-flash")).toBe(DEFAULT_CHAT_MODEL);
    expect(normalizeModelId("gemini-2.5-pro")).toBe(DEFAULT_CHAT_MODEL);
  });

  it("falls back to the default for nullish or empty input", () => {
    expect(normalizeModelId(null)).toBe(DEFAULT_CHAT_MODEL);
    expect(normalizeModelId(undefined)).toBe(DEFAULT_CHAT_MODEL);
    expect(normalizeModelId("")).toBe(DEFAULT_CHAT_MODEL);
    expect(normalizeModelId("not-a-real-model")).toBe(DEFAULT_CHAT_MODEL);
  });
});

describe("resolveUsableModel", () => {
  it("keeps the preferred model when its provider has a key", () => {
    expect(resolveUsableModel(anthropicModel, { anthropic: true, google: false })).toBe(
      anthropicModel,
    );
    expect(resolveUsableModel(googleModel, { anthropic: false, google: true })).toBe(googleModel);
  });

  it("falls back to a usable provider when the preferred model's provider has no key", () => {
    // Anthropic-only user on the Google default should land on an Anthropic model.
    const resolved = resolveUsableModel(googleModel, { anthropic: true, google: false });
    expect(resolved).not.toBeNull();
    expect(MODEL_OPTIONS.find((m) => m.value === resolved)!.provider).toBe("anthropic");
  });

  it("falls back to a usable model even for a stale/renamed preferred id", () => {
    const resolved = resolveUsableModel("gemini-pro-latest", { anthropic: true, google: false });
    expect(MODEL_OPTIONS.find((m) => m.value === resolved)!.provider).toBe("anthropic");
  });

  it("returns null only when the user has no usable key at all", () => {
    expect(resolveUsableModel(googleModel, { anthropic: false, google: false })).toBeNull();
    expect(resolveUsableModel(null, { anthropic: false, google: false })).toBeNull();
  });
});
