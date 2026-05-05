"use client";

import { ChevronsUpDownIcon, EyeIcon, EyeOffIcon, HistoryIcon, LogOutIcon, PlusIcon, Trash2Icon, UserIcon } from "lucide-react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatThreadSummary } from "@/lib/chat/types";

import { MODEL_OPTIONS } from "@/lib/account/models";
import type { ApiKeyProvider } from "@/lib/account/models";

type AccountShellProps = {
  email: string;
  displayName: string;
  organization: string;
  chatModel: string;
  hasAnthropicKey: boolean;
  hasGoogleKey: boolean;
  dbError?: boolean;
  threads?: ChatThreadSummary[];
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

function SidebarAccountMenu() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (loading || !user) {
    return (
      <div className="flex h-12 items-center gap-3 px-2 text-(--ink-soft)">
        <UserIcon className="size-5" />
        <span className="text-base font-semibold">Account</span>
      </div>
    );
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Account";
  const initial = user.firstName?.trim()?.[0]?.toUpperCase() || user.email?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-(--line-strong) bg-(--surface-panel-strong) p-2 shadow-(--shadow-strong)"
        >
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex min-h-10 items-center gap-3 rounded-xl bg-(--accent-soft) px-3 text-sm font-semibold text-(--ink)"
          >
            <UserIcon className="size-4" />
            <span>Account Settings</span>
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void signOut({ returnTo: window.location.origin })}
            className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-(--ink) hover:bg-(--surface-inset)"
          >
            <LogOutIcon className="size-4" />
            <span>Sign out</span>
          </button>
        </div>
      ) : null}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-(--surface-inset)"
      >
        <Avatar className="size-9 border border-(--line-strong) bg-(--surface-panel-strong)">
          <AvatarFallback className="bg-transparent text-sm font-bold text-(--ink)">{initial}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-(--ink)">{displayName}</span>
          <span className="block truncate text-xs text-(--muted)">Free</span>
        </span>
        <ChevronsUpDownIcon className="size-4 shrink-0 text-(--muted)" />
      </button>
    </div>
  );
}

function AccountSidebar({ threads }: { threads: ChatThreadSummary[] }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const html = document.documentElement;
    const read = () => (html.dataset.theme === "dark" ? "dark" : "light");
    setTheme(read());
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-(--line-strong) bg-(--surface-panel) text-(--ink)">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme === "dark" ? "/ciao-sparkle-dark.svg" : "/ciao-sparkle.svg"}
            alt=""
            aria-hidden="true"
            style={{ height: 36, width: 36, objectFit: "contain" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ciao-text.png"
            alt="Ciao!"
            style={{ height: 28, width: "auto", filter: theme === "dark" ? "invert(1)" : "none" }}
          />
        </Link>
      </div>

      <div className="px-4">
        <Link
          href="/"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-black bg-(--accent-blue) px-5 text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft) transition hover:opacity-90"
        >
          <PlusIcon className="size-4" />
          New Chat
        </Link>
      </div>

      <ScrollArea className="mt-4 min-h-0 flex-1 px-3">
        <div className="flex flex-col gap-1 pb-4">
          {threads.length === 0 ? (
            <p className="px-3 py-4 text-sm text-(--muted)">No threads yet.</p>
          ) : null}
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href="/"
              className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-transparent px-3 text-left text-(--ink-soft) transition hover:border-(--line) hover:bg-(--surface-inset) hover:text-(--ink)"
            >
              <HistoryIcon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{thread.title}</span>
              </span>
            </Link>
          ))}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-(--line) p-3">
        <SidebarAccountMenu />
      </div>
    </aside>
  );
}

export function AccountShell({
  email,
  displayName,
  organization,
  chatModel,
  hasAnthropicKey,
  hasGoogleKey,
  dbError,
  threads = [],
}: AccountShellProps) {
  const [section, setSection] = useState<Section>("general");

  return (
    <div className="fixed inset-0 flex" style={{ height: "100dvh" }}>
      <AccountSidebar threads={threads} />

      <div className="min-h-0 flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>

          {dbError ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Unable to connect to the database. Settings cannot be saved until the connection is restored. Check that <code className="font-mono">DATABASE_URL</code> is configured in your environment.
            </div>
          ) : null}

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
    </div>
  );
}
