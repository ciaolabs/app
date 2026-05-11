"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import {
  type ApiKeyProvider,
  type ChatModelValue,
  DEFAULT_CHAT_MODEL,
  getModelOption,
} from "./ai-models";

const STORAGE_PREFIX = "ciao-docs-ai";

function getStorageKey(key: string) {
  return `${STORAGE_PREFIX}-${key}`;
}

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(getStorageKey(key));
}

function writeStorage(key: string, value: string) {
  localStorage.setItem(getStorageKey(key), value);
  window.dispatchEvent(new StorageEvent("storage", { key: getStorageKey(key) }));
}

function removeStorage(key: string) {
  localStorage.removeItem(getStorageKey(key));
  window.dispatchEvent(new StorageEvent("storage", { key: getStorageKey(key) }));
}

export function useAiSettings() {
  const [, rerender] = useState(0);

  const bump = useCallback(() => rerender((n) => n + 1), []);

  const model = (readStorage("model") as ChatModelValue) ?? DEFAULT_CHAT_MODEL;
  const modelOption = getModelOption(model);

  const getApiKey = (provider: ApiKeyProvider) => readStorage(`key-${provider}`);
  const hasApiKey = (provider: ApiKeyProvider) => !!readStorage(`key-${provider}`);

  const activeApiKey = getApiKey(modelOption.provider);
  const googleApiKey = getApiKey("google");
  const isReady = !!activeApiKey;

  return {
    model,
    modelOption,
    isReady,
    activeApiKey,
    googleApiKey,
    hasApiKey,
    getApiKey,

    setModel(value: ChatModelValue) {
      writeStorage("model", value);
      bump();
    },

    setApiKey(provider: ApiKeyProvider, key: string) {
      writeStorage(`key-${provider}`, key);
      bump();
    },

    removeApiKey(provider: ApiKeyProvider) {
      removeStorage(`key-${provider}`);
      bump();
    },
  };
}
