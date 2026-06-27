"use client";

import { useState } from "react";
import {
  MODEL_OPTIONS,
  API_KEY_PROVIDERS,
  type ApiKeyProvider,
  type ChatModelValue,
} from "@/lib/ai-models";
import { useAiSettings } from "@/lib/use-ai-settings";
import { KeyRound, Eye, EyeOff, Trash2, Check } from "lucide-react";

const PROVIDER_LABELS: Record<ApiKeyProvider, string> = {
  google: "Google AI",
  anthropic: "Anthropic",
};

function ApiKeyField({
  provider,
  hasKey,
  onSave,
  onRemove,
}: {
  provider: ApiKeyProvider;
  hasKey: boolean;
  onSave: (key: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);

  if (hasKey && !editing) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Check className="size-4 text-green-400" />
          <span>{PROVIDER_LABELS[provider]}</span>
          <span className="opacity-60">configured</span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => { setEditing(true); setValue(""); }}
            className="rounded p-1 hover:bg-white/10"
          >
            <KeyRound className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 hover:bg-red-500/20 hover:text-red-400"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {PROVIDER_LABELS[provider]} API Key
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter ${PROVIDER_LABELS[provider]} key...`}
            className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 pr-10 text-sm placeholder:opacity-40 focus:border-white/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <button
          type="button"
          disabled={!value.trim()}
          onClick={() => {
            onSave(value.trim());
            setValue("");
            setEditing(false);
            setVisible(false);
          }}
          className="rounded-lg bg-white/15 px-3 py-2 text-sm font-medium disabled:opacity-30 hover:bg-white/25"
        >
          Save
        </button>
        {hasKey && (
          <button
            type="button"
            onClick={() => { setEditing(false); setValue(""); }}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/[0.06]"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export function AiSettings({ onClose }: { onClose?: () => void }) {
  const settings = useAiSettings();

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">AI Settings</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="opacity-60 hover:opacity-100"
          >
            &times;
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Model</label>
        <select
          value={settings.model}
          onChange={(e) => settings.setModel(e.target.value as ChatModelValue)}
          className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm focus:border-white/30 focus:outline-none"
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m.value} value={m.value} className="bg-neutral-900">
              {m.label}
            </option>
          ))}
        </select>
        {!settings.hasApiKey(settings.modelOption.provider) && (
          <p className="text-xs text-amber-400">
            Add a {PROVIDER_LABELS[settings.modelOption.provider]} API key to use this model
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">API Keys</h4>
        <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70">
          <KeyRound className="mt-0.5 size-3.5 shrink-0 text-white/60" />
          <p>
            <span className="font-medium text-white/90">Your keys never leave this browser.</span>{" "}
            They are saved only on this device and sent directly to the AI
            provider — never stored on our servers or in our database.
          </p>
        </div>
        {API_KEY_PROVIDERS.map((provider) => (
          <ApiKeyField
            key={provider}
            provider={provider}
            hasKey={settings.hasApiKey(provider)}
            onSave={(key) => settings.setApiKey(provider, key)}
            onRemove={() => settings.removeApiKey(provider)}
          />
        ))}
      </div>
    </div>
  );
}
