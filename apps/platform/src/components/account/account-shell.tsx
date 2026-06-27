"use client";

import { ChevronsUpDownIcon, EyeIcon, EyeOffIcon, HistoryIcon, LockIcon, LogOutIcon, PanelLeftCloseIcon, PanelLeftIcon, PlusIcon, SearchIcon, Trash2Icon, UserIcon } from "lucide-react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InteractiveDotBackground } from "@/components/interactive-dot-background";
import { cn } from "@/lib/utils";
import type { ChatThreadSummary } from "@/lib/chat/types";

import { MODEL_OPTIONS } from "@/lib/account/models";
import type { ApiKeyProvider } from "@/lib/account/models";
import { useAiSettings } from "@/lib/use-ai-settings";
import { apiRoutes, routes } from "@/lib/routes";

type AccountShellProps = {
  email: string;
  displayName: string;
  organization: string;
  chatModel: string;
  dbError?: boolean;
  threads?: ChatThreadSummary[];
};

type Section = "general" | "models";

const clayPrimaryButton =
  "clay-button-hover inline-flex items-center justify-center gap-2 rounded-full border border-(--ink) bg-(--accent-blue) px-5 text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft)";

const claySecondaryButton =
  "clay-button-hover inline-flex items-center justify-center gap-2 rounded-full border border-(--line-strong) bg-(--surface-panel-strong) px-5 text-sm font-semibold text-(--ink) shadow-(--shadow-soft)";

const clayDangerButton =
  "clay-button-hover inline-flex items-center justify-center gap-2 rounded-full border border-(--accent-rose) bg-(--surface-panel-strong) px-5 text-sm font-semibold text-(--accent-rose) shadow-(--shadow-soft)";

const accountInputClass =
  "h-11 rounded-full border-(--line-strong) bg-(--surface-panel-strong) px-4 text-(--ink) placeholder:text-(--muted) shadow-(--shadow-soft) focus-visible:border-(--ink)";

async function getResponseErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    return typeof payload.error === "string" && payload.error.trim()
      ? payload.error
      : fallback;
  } catch {
    return fallback;
  }
}

function SectionNav({
  active,
  onSelect,
}: {
  active: Section;
  onSelect: (s: Section) => void;
}) {
  return (
    <nav className="w-52 shrink-0 space-y-2">
      {(["general", "models"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className={cn(
            "flex min-h-11 w-full items-center rounded-2xl border px-4 text-left text-sm font-semibold shadow-(--shadow-soft) transition",
            active === s
              ? "border-(--ink) bg-(--accent-blue) text-(--selected-contrast)"
              : "border-(--line-strong) bg-(--surface-panel-strong) text-(--ink-soft) hover:bg-(--surface-inset) hover:text-(--ink)",
          )}
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
      className={cn(clayPrimaryButton, "h-11 disabled:cursor-not-allowed disabled:opacity-50")}
    >
      {loading ? "Saving…" : "Save"}
    </button>
  );
}

function ApiKeyField({
  label,
  provider,
  hasKey,
  onSave,
  onRemove,
}: {
  label: string;
  provider: ApiKeyProvider;
  hasKey: boolean;
  onSave: (key: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(!hasKey);
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);

  // Keys are written straight to the browser (localStorage) — there is no
  // network round-trip and nothing reaches our servers, so this is synchronous.
  function handleSave() {
    if (!value.trim()) return;
    onSave(value.trim());
    setValue("");
    setEditing(false);
    setShow(false);
    toast.success("API key saved in this browser");
  }

  function handleRemove() {
    onRemove();
    setEditing(true);
    setValue("");
    toast.success("API key removed from this browser");
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-(--ink)">{label}</label>
      {editing ? (
        <div className="mt-1 flex gap-2">
          <div className="relative flex-1">
            <Input
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Paste your ${label} here`}
              className={cn(accountInputClass, "pr-10")}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-(--muted) transition hover:text-(--ink)"
            >
              {show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
          <SaveButton onClick={handleSave} loading={false} disabled={!value.trim()} />
          {hasKey && (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setValue("");
              }}
              className={cn(claySecondaryButton, "h-11 px-4")}
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-3">
          <div className="flex h-11 flex-1 items-center rounded-full border border-(--line-strong) bg-(--surface-inset) px-4 font-mono text-sm text-(--muted) shadow-(--shadow-soft)">
            {provider === "anthropic" ? "sk-ant-•••••••••••••" : "AI•••••••••••••••"}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={cn(claySecondaryButton, "h-11 px-4")}
          >
            Update
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className={cn(clayDangerButton, "h-11 px-4")}
          >
            Remove
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
  disabled,
}: {
  email: string;
  initialDisplayName: string;
  initialOrganization: string;
  disabled?: boolean;
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
    if (disabled) return;
    const setter = field === "name" ? setSavingName : setSavingOrg;
    setter(true);
    try {
      const res = await fetch(apiRoutes.accountProfile, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, organization }),
      });
      if (!res.ok) throw new Error(await getResponseErrorMessage(res, "Failed to save"));
      toast.success("Saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setter(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch(apiRoutes.account, { method: "DELETE" });
      if (!res.ok) throw new Error();
      void signOut({ returnTo: window.location.origin });
    } catch {
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="clay-card p-6">
        <h2 className="font-display text-2xl text-(--ink)">Profile</h2>
        <div className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-(--ink)">Display Name</label>
            <div className="mt-1 flex gap-2">
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={disabled}
                className={cn(accountInputClass, "flex-1")}
              />
              <SaveButton onClick={() => saveField("name")} loading={savingName} disabled={disabled} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-(--ink)">Organisation</label>
            <div className="mt-1 flex gap-2">
              <Input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Enter your organisation"
                disabled={disabled}
                className={cn(accountInputClass, "flex-1")}
              />
              <SaveButton onClick={() => saveField("org")} loading={savingOrg} disabled={disabled} />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-(--ink)">Email</p>
            <p className="mt-1 text-sm text-(--muted)">{email}</p>
          </div>
        </div>
      </section>

      <section className="clay-card p-6">
        <h2 className="font-display text-2xl text-(--ink)">Usage Plan</h2>
        <p className="mt-2 text-sm text-(--muted)">Free</p>
      </section>

      <section className="clay-card p-6">
        <h2 className="font-display text-2xl text-(--ink)">Actions</h2>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void signOut({ returnTo: window.location.origin })}
            className={cn(claySecondaryButton, "h-11")}
          >
            <LogOutIcon className="size-4" />
            Sign Out
          </button>
        </div>
      </section>

      <section className="clay-card border-(--accent-rose) p-6">
        <h2 className="font-display text-2xl text-(--accent-rose)">Danger Zone</h2>
        <p className="mt-1 text-sm text-(--muted)">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <div className="mt-4">
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-(--ink)">Are you sure?</p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className={cn(clayDangerButton, "h-11 disabled:opacity-50")}
              >
                <Trash2Icon className="size-4" />
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-sm font-semibold text-(--muted) hover:text-(--ink)"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={cn(clayDangerButton, "h-11")}
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
  disabled,
}: {
  initialChatModel: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  // Keys live only in this browser (localStorage). localStorage can't be read
  // during SSR, so the first client render must match the server's "no keys"
  // markup; we read the real presence after hydration.
  const settings = useAiSettings();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const hasAnthropicKey = hydrated && settings.hasApiKey("anthropic");
  const hasGoogleKey = hydrated && settings.hasApiKey("google");
  const [chatModel, setChatModel] = useState(initialChatModel);
  const [savingModel, setSavingModel] = useState(false);

  async function saveModel() {
    if (disabled) return;
    setSavingModel(true);
    try {
      const res = await fetch(apiRoutes.accountPreferences, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatModel }),
      });
      if (!res.ok) {
        throw new Error(await getResponseErrorMessage(res, "Failed to save model preference"));
      }
      toast.success("Model preference saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save model preference");
    } finally {
      setSavingModel(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="clay-card p-6">
        <h2 className="font-display text-2xl text-(--ink)">Model Preferences</h2>
        <div className="mt-6">
          <label className="block text-sm font-semibold text-(--ink)">Chat model</label>
          <div className="mt-1 flex gap-2">
            <select
              value={chatModel}
              onChange={(e) => setChatModel(e.target.value)}
              disabled={disabled}
              className={cn(accountInputClass, "flex-1")}
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
              disabled={disabled || chatModel === initialChatModel}
            />
          </div>
          <p className="mt-2 text-xs text-(--muted)">
            Make sure you have an API key for the selected model&apos;s provider.
          </p>
        </div>
      </section>

      <section className="clay-card p-6">
        <h2 className="font-display text-2xl text-(--ink)">API Keys</h2>
        <p className="mt-1 text-sm text-(--muted)">
          You provide your own API keys to use the chat.
        </p>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-(--line-strong) bg-(--surface-inset) px-4 py-3 text-sm text-(--ink-soft) shadow-(--shadow-soft)">
          <LockIcon className="mt-0.5 size-4 shrink-0 text-(--accent-blue)" />
          <p>
            <span className="font-semibold text-(--ink)">Your keys never leave this browser.</span>{" "}
            They are saved only on this device and sent directly to the AI
            provider on each request. We never store them on our servers or in our
            database — only you hold them. Clearing your browser data removes them.
          </p>
        </div>
        <div className="mt-6 space-y-6">
          <ApiKeyField
            key={`anthropic-${hasAnthropicKey}`}
            label="Anthropic (Claude) API Key"
            provider="anthropic"
            hasKey={hasAnthropicKey}
            onSave={(key) => settings.setApiKey("anthropic", key)}
            onRemove={() => settings.removeApiKey("anthropic")}
          />
          <ApiKeyField
            key={`google-${hasGoogleKey}`}
            label="Google (Gemini) API Key"
            provider="google"
            hasKey={hasGoogleKey}
            onSave={(key) => settings.setApiKey("google", key)}
            onRemove={() => settings.removeApiKey("google")}
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
            href={routes.account()}
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

function AccountSidebar({
  threads,
  onCollapse,
}: {
  threads: ChatThreadSummary[];
  onCollapse: () => void;
}) {
  const router = useRouter();
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
    <TooltipProvider delayDuration={300}>
      <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-(--line-strong) bg-(--surface-panel) text-(--ink)">
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-5">
          <Link href={routes.chat} className="flex items-center gap-2">
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

          <div className="flex shrink-0 items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Search"
                  onClick={() => router.push(routes.chat)}
                  className="inline-flex size-9 items-center justify-center rounded-xl text-(--ink) transition hover:bg-(--surface-inset)"
                >
                  <SearchIcon className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Search (⌘K)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="New chat"
                  onClick={() => router.push(routes.chat)}
                  className="inline-flex size-9 items-center justify-center rounded-xl text-(--ink) transition hover:bg-(--surface-inset)"
                >
                  <PlusIcon className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>New chat</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Collapse sidebar"
                  onClick={onCollapse}
                  className="inline-flex size-9 items-center justify-center rounded-xl text-(--ink) transition hover:bg-(--surface-inset)"
                >
                  <PanelLeftCloseIcon className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Collapse sidebar</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="px-4">
          <Link
            href={routes.chat}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-(--ink) bg-(--accent-blue) px-5 text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft) transition hover:opacity-90"
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
                href={routes.chat}
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
    </TooltipProvider>
  );
}

export function AccountShell({
  email,
  displayName,
  organization,
  chatModel,
  dbError,
  threads = [],
}: AccountShellProps) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("general");
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash === "models" || hash === "general") setSection(hash);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPeeked, setSidebarPeeked] = useState(false);
  const peekTimerRef = useRef<number>(0);

  const showSidebarPeek = () => {
    window.clearTimeout(peekTimerRef.current);
    setSidebarPeeked(true);
  };
  const hideSidebarPeek = (delay = 200) => {
    window.clearTimeout(peekTimerRef.current);
    peekTimerRef.current = window.setTimeout(() => setSidebarPeeked(false), delay);
  };

  useEffect(() => {
    if (!sidebarCollapsed) setSidebarPeeked(false);
  }, [sidebarCollapsed]);

  useEffect(() => {
    return () => window.clearTimeout(peekTimerRef.current);
  }, []);

  return (
    <main
      className="fixed inset-0 flex overflow-hidden bg-(--background) p-3 text-(--ink)"
      style={{ height: "100dvh" }}
    >
      <InteractiveDotBackground />
      {!sidebarCollapsed && (
        <AccountSidebar threads={threads} onCollapse={() => setSidebarCollapsed(true)} />
      )}

      {sidebarCollapsed && (
        <>
          <div
            aria-hidden="true"
            className="fixed top-4 left-4 z-40 hidden h-[calc(100vh-2rem)] w-2 lg:block"
            onMouseEnter={showSidebarPeek}
          />
          <div
            className={cn(
              "fixed top-4 bottom-4 left-4 z-40 hidden w-[280px] overflow-hidden rounded-3xl border border-(--line-strong) bg-(--background) transition-transform duration-200 ease-out lg:block",
              sidebarPeeked
                ? "translate-x-0"
                : "pointer-events-none -translate-x-[calc(100%+1rem)]",
            )}
            onMouseEnter={showSidebarPeek}
            onMouseLeave={() => hideSidebarPeek(300)}
          >
            <AccountSidebar
              threads={threads}
              onCollapse={() => {
                window.clearTimeout(peekTimerRef.current);
                setSidebarPeeked(false);
                setSidebarCollapsed(false);
              }}
            />
          </div>
        </>
      )}

      {sidebarCollapsed && (
        <TooltipProvider delayDuration={300}>
          <div className="absolute top-4 left-4 z-30 flex items-center gap-1 rounded-2xl border border-(--line-strong) bg-(--surface-panel) p-1 shadow-(--shadow-soft) backdrop-blur">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Open sidebar"
                  onClick={() => setSidebarCollapsed(false)}
                  className="inline-flex size-9 items-center justify-center rounded-xl text-(--ink) transition hover:bg-(--surface-inset)"
                >
                  <PanelLeftIcon className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Open sidebar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Search"
                  onClick={() => router.push(routes.chat)}
                  className="inline-flex size-9 items-center justify-center rounded-xl text-(--ink) transition hover:bg-(--surface-inset)"
                >
                  <SearchIcon className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Search (⌘K)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="New chat"
                  onClick={() => router.push(routes.chat)}
                  className="inline-flex size-9 items-center justify-center rounded-xl text-(--ink) transition hover:bg-(--surface-inset)"
                >
                  <PlusIcon className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>New chat</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )}

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="app-glow app-glow-left" aria-hidden="true" />
        <div className="app-glow app-glow-right" aria-hidden="true" />
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="font-display text-4xl text-(--ink)">Settings</h1>
          </div>

          {dbError ? (
            <div className="mb-6 rounded-2xl border border-(--accent-rose) bg-(--surface-panel-strong) px-4 py-3 text-sm font-medium text-(--accent-rose) shadow-(--shadow-soft)">
              Unable to connect to the database. Settings cannot be saved until the connection is restored. Check that <code className="font-mono">DATABASE_URL</code> or <code className="font-mono">POSTGRES_URL</code> is configured in your environment.
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
                  disabled={dbError}
                />
              ) : (
                <ModelsSection initialChatModel={chatModel} disabled={dbError} />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
