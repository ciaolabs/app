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
      <div className="flex items-center justify-between rounded-lg border border-fd-border bg-fd-card px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Check className="size-4 text-green-500" />
          <span className="text-fd-foreground">{PROVIDER_LABELS[provider]}</span>
          <span className="text-fd-muted-foreground">configured</span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => { setEditing(true); setValue(""); }}
            className="rounded p-1 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
          >
            <KeyRound className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-fd-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-fd-foreground">
        {PROVIDER_LABELS[provider]} API Key
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter ${PROVIDER_LABELS[provider]} key...`}
            className="w-full rounded-lg border border-fd-border bg-fd-background px-3 py-2 pr-10 text-sm text-fd-foreground placeholder:text-fd-muted-foreground focus:border-fd-primary focus:outline-none focus:ring-1 focus:ring-fd-primary"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-fd-muted-foreground hover:text-fd-foreground"
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
          className="rounded-lg bg-fd-primary px-3 py-2 text-sm font-medium text-fd-primary-foreground disabled:opacity-50 hover:bg-fd-primary/90"
        >
          Save
        </button>
        {hasKey && (
          <button
            type="button"
            onClick={() => { setEditing(false); setValue(""); }}
            className="rounded-lg border border-fd-border px-3 py-2 text-sm text-fd-muted-foreground hover:bg-fd-accent"
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
        <h3 className="text-base font-semibold text-fd-foreground">AI Settings</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-fd-muted-foreground hover:text-fd-foreground"
          >
            &times;
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-fd-foreground">Model</label>
        <select
          value={settings.model}
          onChange={(e) => settings.setModel(e.target.value as ChatModelValue)}
          className="w-full rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground focus:border-fd-primary focus:outline-none focus:ring-1 focus:ring-fd-primary"
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        {!settings.hasApiKey(settings.modelOption.provider) && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Add a {PROVIDER_LABELS[settings.modelOption.provider]} API key to use this model
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-fd-foreground">API Keys</h4>
        <p className="text-xs text-fd-muted-foreground">
          Keys are stored in your browser only and sent directly to the AI provider.
        </p>
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
