"use client";

import {
  ArrowUpIcon,
  BotIcon,
  ChevronsUpDownIcon,
  CornerDownLeftIcon,
  HistoryIcon,
  GhostIcon,
  LogOutIcon,
  MenuIcon,
  MonitorIcon,
  MoonIcon,
  PanelLeftCloseIcon,
  PanelLeftIcon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
  SunIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import Link from "next/link";
import dynamic from "next/dynamic";

const LazyMarkdown = dynamic(
  () => import("@/components/chat/markdown-renderer").then((m) => ({ default: m.MarkdownRenderer })),
  { ssr: false, loading: () => <div className="animate-pulse h-6 rounded bg-(--surface-inset)" /> },
);
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
const InteractiveDotBackground = dynamic(
  () => import("@/components/interactive-dot-background").then((m) => ({ default: m.InteractiveDotBackground })),
  { ssr: false },
);
import { IncognitoGhostIcon } from "@/components/incognito-ghost-icon";
import type { SurveyChatContext } from "@/lib/chat/survey-context";
import { surveyContextHasResults } from "@/lib/chat/survey-context";
import type { ChatMessage, ChatThreadSummary, ChatThreadWithMessages } from "@/lib/chat/types";

type ChatShellProps = {
  initialThreads: ChatThreadSummary[];
  surveyContext: SurveyChatContext;
  hasApiKeys: boolean;
};

type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "ambi-theme-mode";
const SIDEBAR_WIDTH_STORAGE_KEY = "ciao-chat-sidebar-width";
const SIDEBAR_COLLAPSED_STORAGE_KEY = "ciao-chat-sidebar-collapsed";
const SIDEBAR_MIN_WIDTH = 260;
const SIDEBAR_MAX_WIDTH = 520;
const SIDEBAR_DEFAULT_WIDTH = 356;

const starterPrompts = [
  "What patterns stand out in my personality results?",
  "How do my values and beliefs interact?",
  "What strengths should I lean into?",
  "What blind spots should I watch for?",
];

const clayPrimaryButton =
  "clay-button-hover inline-flex items-center justify-center gap-2 rounded-full border border-black bg-(--accent-blue) px-5 text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft)";

const claySecondaryButton =
  "clay-button-hover inline-flex items-center justify-center gap-2 rounded-full border border-(--line-strong) bg-(--surface-panel-strong) px-5 text-sm font-semibold text-(--ink) shadow-(--shadow-soft)";

const clayIconButton =
  "clay-button-hover inline-flex size-10 items-center justify-center rounded-full border border-(--line-strong) bg-(--surface-panel-strong) text-(--ink) shadow-(--shadow-soft)";

const clayIconButtonAccent =
  "clay-button-hover inline-flex size-11 items-center justify-center rounded-full border border-black bg-(--accent-blue) text-(--selected-contrast) shadow-(--shadow-soft) disabled:cursor-not-allowed disabled:opacity-60";

function toUIMessage(message: ChatMessage): UIMessage {
  return {
    id: message.id,
    role: message.role,
    parts: [{ type: "text", text: message.content }],
  };
}

function getMessageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

function getContextLabel(context: SurveyChatContext) {
  if (context.personality && context.valuesBeliefs) {
    return "Personality, Values, and Beliefs";
  }

  if (context.personality) {
    return "Personality";
  }

  if (context.valuesBeliefs) {
    return "Values and Beliefs";
  }

  return "No survey results yet";
}

function formatThreadDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function readStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  const datasetMode = document.documentElement.dataset.themeMode;
  if (datasetMode === "light" || datasetMode === "dark" || datasetMode === "system") {
    return datasetMode;
  }
  return "light";
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setMode(readStoredThemeMode());
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    const resolved = resolveTheme(mode);
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themeMode = mode;
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      document.documentElement.dataset.theme = media.matches ? "dark" : "light";
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [mode, hasHydrated]);

  return { mode, setMode, hasHydrated };
}

function ThemeModeRow({
  mode,
  hasHydrated,
  onSelect,
}: {
  mode: ThemeMode;
  hasHydrated: boolean;
  onSelect: (next: ThemeMode) => void;
}) {
  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: "light", label: "Light", icon: <SunIcon className="size-4" /> },
    { mode: "dark", label: "Dark", icon: <MoonIcon className="size-4" /> },
    { mode: "system", label: "System", icon: <MonitorIcon className="size-4" /> },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme mode"
      className="grid grid-cols-3 gap-2"
    >
      {options.map((option) => {
        const isActive = hasHydrated && mode === option.mode;
        return (
          <button
            key={option.mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onSelect(option.mode)}
            className={cn(
              "clay-button-hover inline-flex flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-xs font-semibold shadow-(--shadow-soft) transition",
              isActive
                ? "border-black bg-(--accent-blue) text-(--selected-contrast)"
                : "border-(--line-strong) bg-(--surface-panel-strong) text-(--ink)",
            )}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SettingsMenu({
  surveyContext,
}: {
  surveyContext: SurveyChatContext;
}) {
  const { mode, setMode, hasHydrated } = useThemeMode();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Settings"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className={clayIconButton}
          >
            <Settings2Icon className="size-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-30 w-72 rounded-2xl border border-(--line-strong) bg-(--surface-panel-strong) p-4 shadow-(--shadow-strong)"
        >
          <p className="clay-label">Appearance</p>
          <div className="mt-3">
            <ThemeModeRow mode={mode} hasHydrated={hasHydrated} onSelect={setMode} />
          </div>

          <Separator className="my-4 bg-(--line)" />

          <p className="clay-label">Survey context</p>
          <p className="mt-2 text-sm text-(--ink-soft)">{getContextLabel(surveyContext)}</p>
        </div>
      ) : null}
    </div>
  );
}

function useSidebarLayout() {
  const [width, setWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
      if (storedWidth) {
        const parsed = parseInt(storedWidth, 10);
        if (Number.isFinite(parsed)) {
          setWidth(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, parsed)));
        }
      }
      const storedCollapsed = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      if (storedCollapsed === "true") {
        setCollapsed(true);
      }
    } catch {
      // ignore storage failures
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width));
  }, [width, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? "true" : "false");
  }, [collapsed, hasHydrated]);

  return { width, setWidth, collapsed, setCollapsed };
}


function CollapsedSidebarToolbar({
  onExpand,
  onSearch,
  onNewChat,
}: {
  onExpand: () => void;
  onSearch: () => void;
  onNewChat: () => void;
}) {
  return (
    <div className="absolute top-4 left-4 z-30 flex items-center gap-1 rounded-2xl border border-(--line-strong) bg-(--surface-panel) p-1 shadow-(--shadow-soft) backdrop-blur">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onExpand}
            aria-label="Open sidebar"
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
            onClick={onSearch}
            aria-label="Search"
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
            onClick={onNewChat}
            aria-label="New chat"
            className="inline-flex size-9 items-center justify-center rounded-xl text-(--ink) transition hover:bg-(--surface-inset)"
          >
            <PlusIcon className="size-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>New chat</TooltipContent>
      </Tooltip>
    </div>
  );
}

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  onSelect: () => void;
};

function CommandPalette({
  open,
  onClose,
  threads,
  onNewChat,
  onSelectThread,
}: {
  open: boolean;
  onClose: () => void;
  threads: ChatThreadSummary[];
  onNewChat: () => void;
  onSelectThread: (threadId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      const id = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  const items = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const list: CommandItem[] = [];

    list.push({
      id: "command-new-chat",
      label: "New Chat",
      hint: "Start a fresh conversation",
      icon: <PlusIcon className="size-4" />,
      onSelect: () => {
        onNewChat();
        onClose();
      },
    });

    const filteredThreads = trimmed
      ? threads.filter((thread) => thread.title.toLowerCase().includes(trimmed))
      : threads;

    filteredThreads.slice(0, 30).forEach((thread) => {
      list.push({
        id: `thread-${thread.id}`,
        label: thread.title,
        hint: formatThreadDate(thread.updatedAt),
        icon: <HistoryIcon className="size-4" />,
        onSelect: () => {
          onSelectThread(thread.id);
          onClose();
        },
      });
    });

    if (trimmed && !list.some((item) => item.label.toLowerCase() === trimmed)) {
      // no extra fallback for now
    }

    return list;
  }, [query, threads, onNewChat, onSelectThread, onClose]);

  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(items.length === 0 ? 0 : items.length - 1);
    }
  }, [items.length, activeIndex]);

  if (!open) return null;

  function handleKey(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((value) => Math.min(items.length - 1, value + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((value) => Math.max(0, value - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = items[activeIndex];
      if (item) item.onSelect();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onKeyDown={handleKey}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-(--line-strong) bg-(--surface-panel-strong) shadow-(--shadow-strong)"
      >
        <div className="flex items-center gap-3 border-b border-(--line) px-4 py-3">
          <SearchIcon className="size-5 text-(--muted)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Type a command or search your threads..."
            className="flex-1 bg-transparent text-base text-(--ink) outline-none placeholder:text-(--muted)"
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-(--muted)">No matches.</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {items.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => item.onSelect()}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                        isActive
                          ? "bg-(--accent-soft) text-(--ink)"
                          : "text-(--ink-soft) hover:bg-(--surface-inset) hover:text-(--ink)",
                      )}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-(--line) bg-(--surface-panel) text-(--ink)">
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{item.label}</span>
                        {item.hint ? (
                          <span className="block truncate text-xs text-(--muted)">{item.hint}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-(--line) bg-(--surface-panel) px-4 py-2 text-xs text-(--muted)">
          <span className="inline-flex size-6 items-center justify-center rounded-md border border-(--line) bg-(--surface-panel-strong) text-(--ink)">
            <CornerDownLeftIcon className="size-3.5" />
          </span>
          <span>Type to search or start a new chat</span>
        </div>
      </div>
    </div>
  );
}

function CiaoLogo() {
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
    <div className="flex shrink-0 items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={theme === "dark" ? "/ciao-sparkle-dark.svg" : "/ciao-sparkle.svg"}
        alt=""
        aria-hidden="true"
        className="ciao-wave"
        style={{ height: 36, width: 36, objectFit: "contain" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ciao-text.png"
        alt="Ciao!"
        style={{
          height: 28,
          width: "auto",
          filter: theme === "dark" ? "invert(1)" : "none",
        }}
      />
    </div>
  );
}

function ThreadSidebar({
  threads,
  activeThreadId,
  search,
  onSearch,
  onNewChat,
  onSelectThread,
  onCollapse,
  onOpenSearch,
}: {
  threads: ChatThreadSummary[];
  activeThreadId: string | null;
  search: string;
  onSearch: (value: string) => void;
  onNewChat: () => void;
  onSelectThread: (threadId: string) => void;
  onCollapse?: () => void;
  onOpenSearch?: () => void;
}) {
  const filteredThreads = threads.filter((thread) =>
    thread.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-(--surface-panel) text-(--ink) backdrop-blur">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-5">
        <CiaoLogo />
        <div className="flex shrink-0 items-center gap-1">
          {onOpenSearch ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Search"
                  onClick={onOpenSearch}
                  className="inline-flex size-9 items-center justify-center rounded-xl text-(--ink) transition hover:bg-(--surface-inset)"
                >
                  <SearchIcon className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Search (⌘K)</TooltipContent>
            </Tooltip>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="New chat"
                onClick={onNewChat}
                className="inline-flex size-9 items-center justify-center rounded-xl text-(--ink) transition hover:bg-(--surface-inset)"
              >
                <PlusIcon className="size-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>New chat</TooltipContent>
          </Tooltip>
          {onCollapse ? (
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
          ) : null}
        </div>
      </div>

      <div className="px-4">
        <button
          type="button"
          onClick={onNewChat}
          className={cn(clayPrimaryButton, "h-12 w-full")}
        >
          New Chat
        </button>
      </div>

      <div className="px-4 pt-5">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-(--muted)" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search your threads..."
            className="h-11 rounded-full border border-(--line-strong) bg-(--surface-panel-strong) pl-10 text-(--ink) placeholder:text-(--muted) shadow-(--shadow-soft) focus-visible:border-black"
          />
        </div>
      </div>

      <ScrollArea className="mt-4 min-h-0 flex-1 px-3">
        <div className="flex flex-col gap-1 pb-4">
          {filteredThreads.length === 0 ? (
            <p className="px-3 py-4 text-sm text-(--muted)">No threads yet.</p>
          ) : null}
          {filteredThreads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => onSelectThread(thread.id)}
              className={cn(
                "flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 text-left transition",
                activeThreadId === thread.id
                  ? "border-(--line-strong) bg-(--accent-soft) text-(--ink)"
                  : "border-transparent text-(--ink-soft) hover:border-(--line) hover:bg-(--surface-inset) hover:text-(--ink)",
              )}
            >
              <HistoryIcon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{thread.title}</span>
                <span className="block text-xs text-(--muted)">{formatThreadDate(thread.updatedAt)}</span>
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-(--line) p-3">
        <AccountMenu />
      </div>
    </aside>
  );
}

function AccountMenu() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
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

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Account";
  const initial =
    user.firstName?.trim()?.[0]?.toUpperCase() ||
    user.email?.trim()?.[0]?.toUpperCase() ||
    "?";

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-(--line-strong) bg-(--surface-panel-strong) p-2 shadow-(--shadow-strong)"
        >
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-(--ink) hover:bg-(--surface-inset)"
          >
            <UserIcon className="size-4" />
            <span>Account Settings</span>
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut({ returnTo: window.location.origin });
            }}
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
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-(--surface-inset)"
      >
        <Avatar className="size-9 border border-(--line-strong) bg-(--surface-panel-strong)">
          <AvatarFallback className="bg-transparent text-sm font-bold text-(--ink)">
            {initial}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-(--ink)">
            {displayName}
          </span>
          <span className="block truncate text-xs text-(--muted)">Free</span>
        </span>
        <ChevronsUpDownIcon className="size-4 shrink-0 text-(--muted)" />
      </button>
    </div>
  );
}

function EmptyChat({
  hasSurveyContext,
  hasApiKeys,
  isTemporary,
  onPrompt,
}: {
  hasSurveyContext: boolean;
  hasApiKeys: boolean;
  isTemporary: boolean;
  onPrompt: (prompt: string) => void;
}) {
  const heading = isTemporary
    ? "You’re incognito"
    : !hasSurveyContext
      ? "Complete a survey to start"
      : !hasApiKeys
        ? "Add API keys to start"
        : "How can I help you?";
  const subtitle = isTemporary
    ? "Threads you create won’t save to your history and expire after 24 hours."
    : !hasSurveyContext
      ? "The chat needs at least one submitted survey result before it can personalize feedback."
      : !hasApiKeys
        ? "Add your Anthropic or Google API key in Account Settings to enable the chat."
        : "Ask for a reflective read on your saved survey results, or start with one of these prompts.";

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 py-8 text-center">
      <h1
        className={cn(
          "font-display text-4xl font-black leading-tight sm:text-5xl",
          isTemporary ? "text-white" : "text-(--ink)",
        )}
      >
        {heading}
      </h1>
      <p
        className={cn(
          "mt-4 max-w-2xl text-base leading-7",
          isTemporary ? "text-[#c8d2f5]" : "text-(--ink-soft)",
        )}
      >
        {subtitle}
      </p>

      {isTemporary ? null : !hasSurveyContext ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="https://survey.ciaobang.com/surveys/personality" className={cn(clayPrimaryButton, "h-12")}>
            Take Personality survey
          </Link>
          <Link href="https://survey.ciaobang.com/surveys/values-beliefs" className={cn(claySecondaryButton, "h-12")}>
            Take Values and Beliefs survey
          </Link>
        </div>
      ) : !hasApiKeys ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/account" className={cn(clayPrimaryButton, "h-12")}>
            Go to Account Settings
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid w-full max-w-3xl gap-3 text-left sm:grid-cols-2">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onPrompt(prompt)}
              className="clay-button-hover rounded-2xl border border-(--line-strong) bg-(--surface-panel-strong) px-5 py-4 text-base font-medium text-(--ink) shadow-(--shadow-soft)"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatMessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = getMessageText(message);

  return (
    <div className={cn("flex w-full gap-4", isUser && "justify-end")}>
      {!isUser ? (
        <Avatar className="mt-1 size-9 border border-black bg-(--accent-blue) shadow-(--shadow-soft)">
          <AvatarFallback className="bg-transparent text-(--selected-contrast)">
            <BotIcon className="size-4" />
          </AvatarFallback>
        </Avatar>
      ) : null}
      <div
        className={cn(
          "max-w-[min(760px,85%)] rounded-2xl border px-5 py-4 text-base leading-7 shadow-(--shadow-soft)",
          isUser
            ? "border-black bg-(--accent-blue) text-(--selected-contrast)"
            : "border-(--line-strong) bg-(--surface-panel-strong) text-(--ink)",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{text}</p>
        ) : (
          <LazyMarkdown text={text} />
        )}
      </div>
    </div>
  );
}

export function ChatShell({ initialThreads, surveyContext, hasApiKeys }: ChatShellProps) {
  const [threads, setThreads] = useState(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isTemporary, setIsTemporary] = useState(false);
  const sidebarLayout = useSidebarLayout();
  const activeThreadRef = useRef<string | null>(null);
  const isTemporaryRef = useRef(false);

  useEffect(() => {
    isTemporaryRef.current = isTemporary;
  }, [isTemporary]);
  const hasSurveyContext = surveyContextHasResults(surveyContext);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsPaletteOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const toggleTemporaryRef = useRef<() => void>(() => {});


  const refreshThreads = useCallback(async () => {
    const response = await fetch("/api/chat/threads");

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { threads: ChatThreadSummary[] };
    setThreads(payload.threads);
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          threadId: isTemporaryRef.current ? null : activeThreadRef.current,
          temporary: isTemporaryRef.current,
        }),
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          const nextThreadId = response.headers.get("x-chat-thread-id");

          if (nextThreadId && !isTemporaryRef.current) {
            activeThreadRef.current = nextThreadId;
            setActiveThreadId(nextThreadId);
          }

          return response;
        },
      }),
    [],
  );

  const { messages, sendMessage, setMessages, status, stop, error } = useChat({
    id: activeThreadId ?? "new-chat",
    messages: [],
    transport,
    onFinish: () => {
      if (isTemporaryRef.current) return;
      void refreshThreads();
    },
    onError: (chatError) => {
      toast.error(chatError.message || "Unable to send the message.");
    },
  });

  const isBusy = status === "submitted" || status === "streaming";

  const startNewChat = useCallback(() => {
    activeThreadRef.current = null;
    setActiveThreadId(null);
    setMessages([]);
    setInput("");
    setIsSidebarOpen(false);
    setIsTemporary(false);
  }, [setMessages]);

  const toggleTemporary = useCallback(() => {
    const next = !isTemporaryRef.current;
    isTemporaryRef.current = next;
    setIsTemporary(next);
    if (next) {
      activeThreadRef.current = null;
      setActiveThreadId(null);
      setMessages([]);
      setInput("");
    }
  }, [setMessages]);

  useEffect(() => {
    toggleTemporaryRef.current = toggleTemporary;
  }, [toggleTemporary]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "i"
      ) {
        event.preventDefault();
        toggleTemporaryRef.current();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const loadThread = useCallback(
    async (threadId: string) => {
      setIsLoadingThread(true);

      try {
        const response = await fetch(`/api/chat/threads/${threadId}`);

        if (!response.ok) {
          throw new Error("Unable to load that chat thread.");
        }

        const payload = (await response.json()) as { thread: ChatThreadWithMessages };
        activeThreadRef.current = payload.thread.id;
        setActiveThreadId(payload.thread.id);
        setMessages(payload.thread.messages.map(toUIMessage));
        setIsSidebarOpen(false);
        setIsTemporary(false);
      } catch (threadError) {
        toast.error(threadError instanceof Error ? threadError.message : "Unable to load chat.");
      } finally {
        setIsLoadingThread(false);
      }
    },
    [setMessages],
  );

  const submitPrompt = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || !hasSurveyContext || !hasApiKeys || isBusy) {
        return;
      }

      setInput("");

      try {
        await sendMessage({ text: prompt });
      } catch (sendError) {
        toast.error(sendError instanceof Error ? sendError.message : "Unable to send the message.");
      }
    },
    [hasSurveyContext, hasApiKeys, isBusy, sendMessage],
  );

  return (
    <TooltipProvider>
      <main
        className={cn(
          "fixed top-0 right-0 bottom-0 left-0 flex h-screen w-screen overflow-hidden text-(--ink) transition-colors",
          isTemporary && "incognito-bg",
        )}
        style={{ height: "100dvh", width: "100dvw" }}
      >
        <InteractiveDotBackground />
        {isTemporary ? (
          <div aria-hidden="true" className="incognito-maze">
            <span className="maze-ghost maze-ghost-1">
              <GhostIcon className="size-full" />
            </span>
            <span className="maze-ghost maze-ghost-2">
              <GhostIcon className="size-full" />
            </span>
            <span className="maze-ghost maze-ghost-3">
              <GhostIcon className="size-full" />
            </span>
            <span className="maze-ghost maze-ghost-4">
              <GhostIcon className="size-full" />
            </span>
          </div>
        ) : null}
        {sidebarLayout.collapsed ? (
          <CollapsedSidebarToolbar
            onExpand={() => sidebarLayout.setCollapsed(false)}
            onSearch={() => setIsPaletteOpen(true)}
            onNewChat={startNewChat}
          />
        ) : (
          <div
            className="relative hidden shrink-0 border-r border-(--line-strong) lg:block"
            style={{ width: "280px" }}
          >
            <ThreadSidebar
              threads={threads}
              activeThreadId={activeThreadId}
              search={search}
              onSearch={setSearch}
              onNewChat={startNewChat}
              onSelectThread={loadThread}
              onCollapse={() => sidebarLayout.setCollapsed(true)}
              onOpenSearch={() => setIsPaletteOpen(true)}
            />
          </div>
        )}

        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute top-4 left-4 z-30 text-(--ink) hover:bg-(--surface-inset) lg:hidden"
              aria-label="Open chat history"
            >
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[340px] border-(--line) bg-(--surface-panel) p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Chat history</SheetTitle>
              <SheetDescription>Open a saved personalized survey chat.</SheetDescription>
            </SheetHeader>
            <ThreadSidebar
              threads={threads}
              activeThreadId={activeThreadId}
              search={search}
              onSearch={setSearch}
              onNewChat={startNewChat}
              onSelectThread={loadThread}
            />
          </SheetContent>
        </Sheet>

        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-20 flex shrink-0 justify-end px-4 pt-4">
            <div className="flex items-center gap-2 rounded-full border border-(--line-strong) bg-(--surface-panel) px-2 py-2 shadow-(--shadow-soft) backdrop-blur">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={isTemporary ? "Turn off incognito mode" : "Use incognito"}
                    aria-pressed={isTemporary}
                    onClick={toggleTemporary}
                    className={cn(
                      clayIconButton,
                      "incognito-toggle-btn",
                      isTemporary &&
                        "border-black bg-(--accent-blue) text-(--selected-contrast)",
                    )}
                  >
                    <IncognitoGhostIcon className="size-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="inline-flex items-center gap-2">
                    <span>{isTemporary ? "Incognito mode (on)" : "Use incognito"}</span>
                    <span className="inline-flex items-center gap-0.5 rounded-md border border-(--line) bg-(--surface-panel) px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-(--ink-soft)">
                      ⇧⌘I
                    </span>
                  </span>
                </TooltipContent>
              </Tooltip>
              <SettingsMenu surveyContext={surveyContext} />
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8">
            {messages.length === 0 ? (
              <EmptyChat
                hasSurveyContext={hasSurveyContext}
                hasApiKeys={hasApiKeys}
                isTemporary={isTemporary}
                onPrompt={submitPrompt}
              />
            ) : (
              <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-4">
                {messages.map((message) => (
                  <ChatMessageBubble key={message.id} message={message} />
                ))}
                {isLoadingThread ? (
                  <p className="text-sm text-(--muted)">Loading thread...</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="z-20 shrink-0 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
            <div className="mx-auto w-full max-w-4xl">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitPrompt(input);
                }}
                className={cn(
                  "rounded-3xl border bg-(--surface-panel-strong) p-3 shadow-(--shadow-strong)",
                  isTemporary
                    ? "border-2 border-dashed border-[#3b4f8a]"
                    : "border-(--line-strong)",
                )}
              >
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type your message here..."
                  disabled={!hasSurveyContext || !hasApiKeys || isBusy}
                  className="max-h-44 min-h-20 border-0 bg-transparent px-2 py-2 text-base text-(--ink) placeholder:text-(--muted) focus-visible:border-0"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submitPrompt(input);
                    }
                  }}
                />
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm text-(--ink-soft)">
                    <span className="truncate font-semibold">{getContextLabel(surveyContext)}</span>
                    <Separator orientation="vertical" className="h-4 bg-(--line)" />
                    <span className="hidden sm:inline">Vercel AI Gateway</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isBusy ? (
                      <button
                        type="button"
                        onClick={() => void stop()}
                        aria-label="Stop response"
                        className={clayIconButton}
                      >
                        <XIcon className="size-4" />
                      </button>
                    ) : null}
                    <button
                      type="submit"
                      disabled={!hasSurveyContext || !hasApiKeys || isBusy || !input.trim()}
                      className={clayIconButtonAccent}
                      aria-label="Send message"
                    >
                      <ArrowUpIcon className="size-5" />
                    </button>
                  </div>
                </div>
              </form>
              {error ? (
                <p className="mt-3 text-center text-sm text-(--accent-rose)">{error.message}</p>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <CommandPalette
        open={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        threads={threads}
        onNewChat={startNewChat}
        onSelectThread={loadThread}
      />
    </TooltipProvider>
  );
}
