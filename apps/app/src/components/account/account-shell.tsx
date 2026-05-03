"use client";

import { EyeIcon, EyeOffIcon, LogOutIcon, Trash2Icon } from "lucide-react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { MODEL_OPTIONS } from "@/lib/account/models";
import type { ApiKeyProvider } from "@/lib/account/models";

type AccountShellProps = {
  email: string;
  displayName: string;
  organization: string;
  chatModel: string;
  hasAnthropicKey: boolean;
  hasGoogleKey: boolean;
};

type Section = "general" | "models";

function SectionNav({
  active,
  onSelect,
}: {
  active: Section;
  onSelect: (s: Section) => void;
}) {
  return (
    <nav className="w-52 shrink-0">
      {(["general", "models"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className={`block w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition ${
            active === s
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          {s === "general" ? "General" : "Models & API Keys"}
        </button>
      ))}
    </nav>
  );
}

function SaveButton({
  onClick,
  loading,
  disabled,
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Saving…" : "Save"}
    </button>
  );
}

function ApiKeyField({
  label,
  provider,
  hasKey,
  onSaved,
  onRemoved,
}: {
  label: string;
  provider: ApiKeyProvider;
  hasKey: boolean;
  onSaved: () => void;
  onRemoved: () => void;
}) {
  const [editing, setEditing] = useState(!hasKey);
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleSave() {
    if (!value.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/account/api-keys/${provider}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: value }),
      });
      if (!res.ok) throw new Error("Failed to save key");
      setValue("");
      setEditing(false);
      onSaved();
      toast.success("API key saved");
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch(`/api/account/api-keys/${provider}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove key");
      setEditing(true);
      setValue("");
      onRemoved();
      toast.success("API key removed");
    } catch {
      toast.error("Failed to remove API key");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {editing ? (
        <div className="mt-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Paste your ${label} here`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-gray-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
          <SaveButton onClick={handleSave} loading={saving} disabled={!value.trim()} />
          {hasKey && (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setValue("");
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-3">
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            {provider === "anthropic" ? "sk-ant-•••••••••••••" : "AI•••••••••••••••"}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Update
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {removing ? "Removing…" : "Remove"}
          </button>
        </div>
      )}
    </div>
  );
}

function GeneralSection({
  email,
  initialDisplayName,
  initialOrganization,
}: {
  email: string;
  initialDisplayName: string;
  initialOrganization: string;
}) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [organization, setOrganization] = useState(initialOrganization);
  const [savingName, setSavingName] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveField(field: "name" | "org") {
    const setter = field === "name" ? setSavingName : setSavingOrg;
    setter(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, organization }),
      });
      if (!res.ok) throw new Error();
      toast.success("Saved");
      router.refresh();
    } catch {
      toast.error("Failed to save");
    } finally {
      setter(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error();
      void signOut({ returnTo: window.location.origin });
    } catch {
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        <div className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Display Name</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              />
              <SaveButton onClick={() => saveField("name")} loading={savingName} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Organisation</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Enter your organisation"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              />
              <SaveButton onClick={() => saveField("org")} loading={savingOrg} />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Email</p>
            <p className="mt-1 text-sm text-gray-500">{email}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900">Usage Plan</h2>
        <p className="mt-2 text-sm text-gray-500">Free</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900">Actions</h2>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void signOut({ returnTo: window.location.origin })}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <LogOutIcon className="size-4" />
            Sign Out
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-red-600">Danger Zone</h2>
        <p className="mt-1 text-sm text-gray-500">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <div className="mt-4">
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-gray-700">Are you sure?</p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2Icon className="size-4" />
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-400 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2Icon className="size-4" />
              Delete Account
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function ModelsSection({
  initialChatModel,
  initialHasAnthropicKey,
  initialHasGoogleKey,
}: {
  initialChatModel: string;
  initialHasAnthropicKey: boolean;
  initialHasGoogleKey: boolean;
}) {
  const router = useRouter();
  const [chatModel, setChatModel] = useState(initialChatModel);
  const [savingModel, setSavingModel] = useState(false);
  const [hasAnthropicKey, setHasAnthropicKey] = useState(initialHasAnthropicKey);
  const [hasGoogleKey, setHasGoogleKey] = useState(initialHasGoogleKey);

  async function saveModel() {
    setSavingModel(true);
    try {
      const res = await fetch("/api/account/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatModel }),
      });
      if (!res.ok) throw new Error();
      toast.success("Model preference saved");
      router.refresh();
    } catch {
      toast.error("Failed to save model preference");
    } finally {
      setSavingModel(false);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-bold text-gray-900">Model Preferences</h2>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">Chat model</label>
          <div className="mt-1 flex gap-2">
            <select
              value={chatModel}
              onChange={(e) => setChatModel(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <SaveButton
              onClick={saveModel}
              loading={savingModel}
              disabled={chatModel === initialChatModel}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            Make sure you have an API key for the selected model&apos;s provider.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
        <p className="mt-1 text-sm text-gray-500">
          You must provide your own API keys. Keys are encrypted at rest and never shared.
        </p>
        <div className="mt-6 space-y-6">
          <ApiKeyField
            label="Anthropic (Claude) API Key"
            provider="anthropic"
            hasKey={hasAnthropicKey}
            onSaved={() => setHasAnthropicKey(true)}
            onRemoved={() => setHasAnthropicKey(false)}
          />
          <ApiKeyField
            label="Google (Gemini) API Key"
            provider="google"
            hasKey={hasGoogleKey}
            onSaved={() => setHasGoogleKey(true)}
            onRemoved={() => setHasGoogleKey(false)}
          />
        </div>
      </section>
    </div>
  );
}

export function AccountShell({
  email,
  displayName,
  organization,
  chatModel,
  hasAnthropicKey,
  hasGoogleKey,
}: AccountShellProps) {
  const [section, setSection] = useState<Section>("general");

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <Link
            href="/"
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            ← Back to chat
          </Link>
        </div>

        <div className="flex gap-10">
          <SectionNav active={section} onSelect={setSection} />

          <div className="min-w-0 flex-1">
            {section === "general" ? (
              <GeneralSection
                email={email}
                initialDisplayName={displayName}
                initialOrganization={organization}
              />
            ) : (
              <ModelsSection
                initialChatModel={chatModel}
                initialHasAnthropicKey={hasAnthropicKey}
                initialHasGoogleKey={hasGoogleKey}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
