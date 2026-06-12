"use client";

import {
  ArrowUpIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  CornerDownLeftIcon,
  CopyIcon,
  HistoryIcon,
  Loader2Icon,
  LogOutIcon,
  MenuIcon,
  MonitorIcon,
  MoreHorizontalIcon,
  MoonIcon,
  PanelLeftCloseIcon,
  PanelLeftIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
  SunIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Trash2Icon,
  UserIcon,
  WrenchIcon,
  XIcon,
} from "lucide-react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import Link from "next/link";
import dynamic from "next/dynamic";

import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
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
import {
  THEME_STORAGE_KEY,
  type ThemeMode,
  applyResolvedTheme,
  readStoredThemeMode,
  resolveTheme,
} from "@/lib/theme";
import { MODEL_OPTIONS, resolveUsableModel, type ApiKeyProvider } from "@/lib/account/models";
const InteractiveDotBackground = dynamic(
  () => import("@/components/interactive-dot-background").then((m) => ({ default: m.InteractiveDotBackground })),
  { ssr: false },
);
// Lazy-load the Lottie player so its WASM/canvas runtime isn't in the initial
// chat bundle — it's only needed transiently for the "Thinking..." indicator.
const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((m) => ({ default: m.DotLottieReact })),
  { ssr: false },
);
import { IncognitoGhostIcon } from "@/components/incognito-ghost-icon";
import { DocsIcon } from "@/components/docs-icon";
import type { SurveyChatContext } from "@/lib/chat/survey-context";
import { surveyContextHasResults } from "@/lib/chat/survey-context";
import type { ChatMessage, ChatThreadSummary, ChatThreadWithMessages } from "@/lib/chat/types";

type ChatShellProps = {
  initialThreads: ChatThreadSummary[];
  surveyContext: SurveyChatContext;
  apiKeyProviders: { anthropic: boolean; google: boolean };
  initialChatModel: string;
};

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

const genericStarterPrompts = [
  "What is the Ciao personality assessment?",
  "How are personality traits scored?",
  "What's the difference between values and beliefs?",
  "Which survey should I start with?",
];

const clayPrimaryButton =
  "clay-button-hover inline-flex items-center justify-center gap-2 rounded-full border border-(--ink) bg-(--accent-blue) px-5 text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft)";

const claySecondaryButton =
  "clay-button-hover inline-flex items-center justify-center gap-2 rounded-full border border-(--line-strong) bg-(--surface-panel-strong) px-5 text-sm font-semibold text-(--ink) shadow-(--shadow-soft)";

const clayIconButton =
  "clay-button-hover inline-flex size-10 items-center justify-center rounded-full border border-(--line-strong) bg-(--surface-panel-strong) text-(--ink) shadow-(--shadow-soft)";

const clayIconButtonAccent =
  "clay-button-hover inline-flex size-11 items-center justify-center rounded-full border border-(--ink) bg-(--accent-blue) text-(--selected-contrast) shadow-(--shadow-soft) disabled:cursor-not-allowed disabled:opacity-60";

const SURVEY_CONTEXT_URL = "/api/survey-context";

function ThinkingLottie({ className }: { className?: string }) {
  return (
    <DotLottieReact
      src="/loading.lottie"
      loop
      autoplay
      className={className}
      aria-label="Ciao! is thinking"
    />
  );
}

function CiaoIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="13"
      viewBox="0 0 63 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M43.8868 36.4415C39.2366 36.1663 34.5935 35.623 29.9504 35.6089C25.1026 35.5947 19.6974 34.4022 16.649 40.0191C16.5926 40.125 16.4374 40.1814 16.388 40.2873C15.8023 41.5786 14.9767 42.8276 14.7226 44.1824C14.4404 45.6784 16.1198 47.1108 18.3708 47.6824C23.4444 48.9808 28.6167 49.3195 33.8314 49.1431C35.525 49.1431 37.2255 49.1783 38.9191 49.1219C39.4624 49.1078 40.1822 49.0443 40.4997 48.7056C42.8283 46.2358 45.3404 43.879 46.4765 40.5342C47.2598 38.2197 46.1872 36.5685 43.8939 36.4345L43.8868 36.4415ZM28.2568 44.9233L27.4171 46.0876C24.2841 45.7066 21.645 45.4526 19.0482 45.0009C18.8365 44.9657 18.639 44.7822 18.4625 44.5493C18.0251 43.9848 18.1521 43.1663 18.7448 42.7923C18.9706 42.6512 19.1894 42.5524 19.4081 42.5594C21.9766 42.6582 24.5522 42.884 27.1067 43.1874C27.4242 43.2227 27.7206 43.3991 28.024 43.5967C28.4544 43.8931 28.5673 44.4929 28.2568 44.9233ZM29.7316 40.7883C29.5976 40.9153 29.4706 40.9929 29.3365 40.9929C28.0946 41.007 26.8597 40.7459 25.145 40.5342C24.5734 40.506 22.7035 40.379 21.6662 40.2096C21.645 40.2096 21.6238 40.2026 21.6027 40.1955C20.89 40.0262 21.1934 38.2974 21.8355 37.8316C21.9837 37.7258 22.1319 37.6552 22.273 37.6623C24.5734 37.7117 27.6641 38.1068 29.9574 38.3891C30.0068 38.3891 30.0562 38.4103 30.1056 38.4385C30.6843 38.756 30.2609 40.3014 29.7387 40.7883H29.7316ZM31.3828 45.9536C31.6298 44.133 32.4766 43.3074 34.5935 43.6249C36.6258 43.9284 38.7356 43.7943 40.9584 43.8649C40.528 47.2378 32.9494 46.7015 31.3828 45.9536ZM32.7588 40.5554C33.3798 39.0453 39.8153 38.6431 43.1671 39.9838C41.8687 42.1149 37.2044 42.3124 32.7588 40.5554Z" fill="currentColor"/>
      <path d="M62.2406 6.93164C62.0148 4.99819 62.0289 2.41554 59.4181 1.90042C55.3254 1.08893 51.1832 0.545589 47.0341 0.0445839C45.6863 -0.117714 44.2821 0.206882 42.899 0.319784C35.9343 0.856072 28.9626 1.30063 22.0191 2.01332C20.8618 2.13328 19.38 3.16352 18.8155 4.19376C16.7691 7.91249 16.4445 12.1252 16.4445 16.2602C16.4445 20.3459 17.0302 24.4315 17.2137 28.5243C17.2489 29.2864 16.7903 30.2743 16.2399 30.8317C13.9536 33.118 11.6038 35.3549 9.15524 37.4647C5.9234 40.252 2.95265 43.1804 1.65427 47.4143C1.44258 48.1129 1.16032 48.8256 0.736935 49.4042C-0.483824 51.0836 -0.222737 52.3256 1.78128 53.0312C3.24902 53.5534 4.80143 53.885 6.33973 54.1602C13.008 55.3457 19.6834 56.4818 25.766 57.5332C31.2983 57.0322 36.1178 56.5171 40.9514 56.1854C42.7579 56.0584 44.0633 55.3104 45.1147 53.9626C46.9635 51.5846 48.7347 49.1431 50.6187 46.7933C54.2316 42.2913 57.2094 37.4295 59.0159 31.9255C59.4745 30.5283 59.2417 28.8489 59.8979 27.5928C61.7043 24.0928 62.5793 20.4164 62.6076 16.5354C62.6287 13.3318 62.6287 10.1 62.2547 6.93164H62.2406ZM50.1601 42.2772C48.4101 44.3377 46.9988 46.6945 45.5028 48.9667C43.6117 51.8316 41.0361 53.1441 37.5644 53.4828C31.6017 54.0614 25.6602 54.4354 19.7257 53.4969C14.7792 52.7137 9.87499 51.6623 4.94961 50.7449C3.58773 50.4909 3.36898 49.7429 3.89115 48.5786C5.79638 44.3165 8.43548 40.7107 12.3659 38.001C14.5746 36.4839 16.3739 34.3811 18.4626 32.6664C19.0977 32.1442 20.0927 31.742 20.883 31.7914C31.8063 32.5535 42.7297 32.9275 53.653 31.7914C54.1187 31.742 54.6056 31.869 55.3042 31.9396C54.1116 35.8982 52.6721 39.3135 50.1601 42.2702V42.2772ZM58.7618 22.9779C58.3455 24.742 57.2165 26.3791 56.1862 27.9174C55.8193 28.4678 54.782 28.7995 54.034 28.8206C47.2458 29.0323 40.4504 29.2017 33.6622 29.3005C31.3194 29.3358 28.9838 29.3005 26.641 29.2299C20.9394 29.0676 20.3326 29.5333 19.8034 25.8852C19.5564 24.1916 19.4435 22.4769 19.3235 20.7622C19.2247 19.365 19.2318 17.9679 19.3376 16.5778L20.0645 7.24213C20.1774 6.48003 21.5392 5.53447 22.4707 5.32984C25.3497 4.68065 28.2852 4.24315 31.2206 3.91856C35.264 3.474 39.3285 2.88832 43.3788 2.94477C47.4998 2.99417 51.6348 3.61513 55.7205 4.22198C58.7195 4.67359 59.03 5.32984 59.4675 8.32176C60.1872 13.2612 59.905 18.1655 58.7618 22.9709V22.9779Z" fill="currentColor"/>
      <path d="M52.2445 25.5676C53.0317 24.392 53.8945 23.141 54.2126 21.7929V21.7875C55.0862 18.1154 55.3019 14.3677 54.7519 10.5931C54.4176 8.30679 54.1803 7.80531 51.8886 7.4602L51.7784 7.44384C48.6921 6.98536 45.5695 6.5215 42.4574 6.48419C39.3622 6.44106 36.2563 6.88862 33.1665 7.22833C30.9233 7.47638 28.6801 7.8107 26.48 8.30679C25.7682 8.46317 24.7275 9.18574 24.6413 9.76811L24.0858 16.9021C24.005 17.9644 23.9996 19.0321 24.0751 20.0998C24.1667 21.4101 24.253 22.7204 24.4417 24.0146C24.8462 26.8024 25.3099 26.4465 29.6669 26.5705C31.4571 26.6244 33.242 26.6514 35.0322 26.6244C40.2196 26.549 45.4124 26.4195 50.5998 26.2578C51.1714 26.2416 51.9641 25.9882 52.2445 25.5676Z" fill="currentColor"/>
    </svg>
  );
}

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

const TOOL_LABELS: Record<string, string> = {
  searchDocs: "Searching survey docs",
  recallSurveyDetail: "Recalling survey detail",
  compareDimensions: "Comparing dimensions",
};

function humanizeToolName(toolName: string) {
  if (TOOL_LABELS[toolName]) return TOOL_LABELS[toolName];
  return toolName.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function summarizeToolInput(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  if (typeof obj.query === "string" && obj.query.trim()) return obj.query.trim();
  if (typeof obj.section === "string") return obj.section;
  if (Array.isArray(obj.labels)) return (obj.labels as unknown[]).join(", ");
  return null;
}

type ToolMessagePart = {
  type: string;
  toolCallId?: string;
  state?: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function ToolCallPart({ part }: { part: ToolMessagePart }) {
  const toolName =
    part.type === "dynamic-tool"
      ? (part as { toolName?: string }).toolName ?? "tool"
      : part.type.replace(/^tool-/, "");
  const label = humanizeToolName(toolName);
  const summary = summarizeToolInput(part.input);
  const isPending = part.state === "input-streaming" || part.state === "input-available";
  const isError = part.state === "output-error";

  return (
    <details className="my-2 rounded-xl border border-(--line) bg-(--surface-inset) text-sm text-(--ink-soft)">
      <summary
        className={cn(
          "flex cursor-pointer items-center gap-2 px-3 py-2 font-semibold",
          isError ? "text-(--accent-rose)" : "text-(--ink)",
        )}
      >
        {isPending ? (
          <Loader2Icon className="size-4 shrink-0 animate-spin" />
        ) : isError ? (
          <XIcon className="size-4 shrink-0" />
        ) : (
          <CheckIcon className="size-4 shrink-0" />
        )}
        <WrenchIcon className="size-3.5 shrink-0 text-(--muted)" />
        <span className="truncate">
          {label}
          {summary ? (
            <span className="ml-1 font-normal text-(--ink-soft)">— {summary}</span>
          ) : null}
        </span>
      </summary>
      <div className="space-y-2 border-t border-(--line) px-3 py-2 text-xs">
        {part.input !== undefined ? (
          <div>
            <div className="clay-label">Input</div>
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5">
              {JSON.stringify(part.input, null, 2)}
            </pre>
          </div>
        ) : null}
        {part.state === "output-available" && part.output !== undefined ? (
          <div>
            <div className="clay-label">Output</div>
            <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5">
              {JSON.stringify(part.output, null, 2)}
            </pre>
          </div>
        ) : null}
        {isError ? (
          <p className="text-(--accent-rose)">{part.errorText ?? "Tool errored."}</p>
        ) : null}
      </div>
    </details>
  );
}

function ReasoningPart({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <details className="my-2 rounded-xl border border-(--line) bg-(--surface-inset) text-sm text-(--ink-soft)">
      <summary className="cursor-pointer px-3 py-2 font-semibold text-(--ink)">Thinking</summary>
      <p className="whitespace-pre-wrap border-t border-(--line) px-3 py-2 text-xs leading-5">
        {text}
      </p>
    </details>
  );
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

function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setMode(readStoredThemeMode());
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    applyResolvedTheme(resolveTheme(mode), mode);
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyResolvedTheme(media.matches ? "dark" : "light", "system");
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
                ? "border-(--ink) bg-(--accent-blue) text-(--selected-contrast)"
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
            className="inline-flex size-9 items-center justify-center rounded-xl text-(--ink) transition hover:bg-(--surface-inset)"
          >
            <Settings2Icon className="size-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Settings</TooltipContent>
      </Tooltip>

      {open ? (
        <div
          role="menu"
          className="absolute left-12 bottom-0 z-30 w-72 rounded-2xl border border-(--line-strong) bg-(--surface-panel-strong) p-4 shadow-(--shadow-strong)"
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
  const [hovered, setHovered] = useState(false);
  return (
    <div className="absolute top-7 left-7 z-30 flex flex-col items-center gap-1 rounded-2xl border border-(--line-strong) bg-(--surface-panel) p-1 shadow-(--shadow-soft) backdrop-blur">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onExpand}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
            aria-label="Open sidebar"
            className="inline-flex size-9 items-center justify-center rounded-xl text-(--ink) transition hover:bg-(--surface-inset)"
          >
            {hovered ? (
              <PanelLeftIcon className="size-5" />
            ) : (
              <CiaoSparkleImg size={28} />
            )}
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

function ModelPicker({
  value,
  onChange,
  providers,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  providers: { anthropic: boolean; google: boolean };
  disabled?: boolean;
}) {
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

  const current = MODEL_OPTIONS.find((m) => m.value === value) ?? MODEL_OPTIONS[0]!;
  const hasAnyKey = providers.anthropic || providers.google;
  const isProviderReady = (provider: ApiKeyProvider) =>
    provider === "anthropic" ? providers.anthropic : providers.google;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Select AI model"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-(--ink) transition hover:bg-(--surface-inset) disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <span className="truncate">{current.label}</span>
        <ChevronsUpDownIcon className="size-3.5 shrink-0 text-(--ink-soft)" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-30 mb-2 w-72 rounded-2xl border border-(--line-strong) bg-(--surface-panel-strong) p-1.5 shadow-(--shadow-strong)"
        >
          <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-(--ink-soft) uppercase">
            AI model
          </p>
          {MODEL_OPTIONS.map((option) => {
            const ready = isProviderReady(option.provider);
            const selected = option.value === current.value;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                disabled={!ready}
                onClick={() => {
                  if (!ready) return;
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition",
                  ready
                    ? "text-(--ink) hover:bg-(--surface-inset)"
                    : "cursor-not-allowed text-(--ink-soft) opacity-60",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{option.label}</span>
                  <span className="block truncate text-xs text-(--ink-soft)">
                    {option.provider === "anthropic" ? "Anthropic" : "Google"}
                    {!ready ? " — no API key" : ""}
                  </span>
                </span>
                {selected ? <CheckIcon className="size-4 shrink-0 text-(--ink)" /> : null}
              </button>
            );
          })}

          <Separator className="my-1.5 bg-(--line)" />

          <Link
            href="/chat/account#models"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium text-(--ink) transition hover:bg-(--surface-inset)"
          >
            <span>{hasAnyKey ? "Manage models & API keys" : "Set up models & API keys"}</span>
            <WrenchIcon className="size-4 text-(--ink-soft)" />
          </Link>
        </div>
      ) : null}
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

  if (typeof document === "undefined") return null;

  return createPortal(
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
    </div>,
    document.body,
  );
}

function useDocumentTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const html = document.documentElement;
    const read = () => (html.dataset.theme === "dark" ? "dark" : "light");
    setTheme(read());
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

function CiaoSparkleImg({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  const theme = useDocumentTheme();
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={theme === "dark" ? "/ciao-sparkle-dark.svg" : "/ciao-sparkle.svg"}
      alt=""
      aria-hidden="true"
      className={cn("ciao-wave", className)}
      style={{ height: size, width: size, objectFit: "contain" }}
    />
  );
}

function CiaoLogo() {
  const theme = useDocumentTheme();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <CiaoSparkleImg size={36} />
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

function ThreadSidebarItem({
  thread,
  isActive,
  isLoading,
  isPinned,
  renamingThreadId,
  onSelect,
  onDelete,
  onRename,
  onStartRename,
  onPin,
}: {
  thread: ChatThreadSummary;
  isActive: boolean;
  isLoading: boolean;
  isPinned: boolean;
  renamingThreadId: string | null;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onStartRename: () => void;
  onPin: () => void;
}) {
  const isRenaming = renamingThreadId === thread.id;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [renameValue, setRenameValue] = useState(thread.title);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isRenaming) {
      setRenameValue(thread.title);
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [isRenaming, thread.title]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setMenuOpen(true);
  }

  return (
    <div className="group relative">
      {isRenaming ? (
        <div
          className={cn(
            "flex min-h-14 w-full items-center gap-3 rounded-xl border px-3",
            isActive
              ? "border-(--line-strong) bg-(--accent-soft)"
              : "border-(--line) bg-(--surface-inset)",
          )}
        >
          <input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRename(renameValue);
              if (e.key === "Escape") onRename(thread.title);
            }}
            onBlur={() => onRename(renameValue)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-(--ink) outline-none"
          />
        </div>
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={onSelect}
          className={cn(
            "flex min-h-14 w-full items-center gap-3 overflow-hidden rounded-xl border px-3 pr-3 text-left transition group-hover:pr-10",
            isActive
              ? "border-(--line-strong) bg-(--accent-soft) text-(--ink)"
              : "border-transparent text-(--ink-soft) group-hover:border-(--line) group-hover:bg-(--surface-inset) group-hover:text-(--ink)",
            isLoading && "cursor-wait opacity-70",
          )}
        >
          {isLoading ? (
            <Loader2Icon className="size-4 shrink-0 animate-spin" />
          ) : isPinned ? (
            <PinIcon className="size-4 shrink-0 rotate-45" />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{thread.title}</p>
            <p className="truncate text-xs text-(--muted)">{formatThreadDate(thread.updatedAt)}</p>
          </div>
        </button>
      )}
      {!isRenaming && (
        <div
          ref={menuRef}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 transition-opacity",
            menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          <button
            ref={triggerRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (menuOpen) {
                setMenuOpen(false);
              } else {
                openMenu();
              }
            }}
            className="inline-flex size-6 items-center justify-center rounded-md text-(--muted) hover:bg-(--surface-panel) hover:text-(--ink) transition"
          >
            <MoreHorizontalIcon className="size-4" />
          </button>
        </div>
      )}
      {menuOpen && menuPos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: "fixed", top: menuPos.top, right: menuPos.right }}
            className="z-[9999] w-40 overflow-hidden rounded-xl border border-(--line-strong) bg-(--surface-panel) py-1 shadow-(--shadow-strong)"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPin();
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-(--ink) hover:bg-(--surface-inset) transition"
            >
              <PinIcon className="size-4 rotate-45" />
              {isPinned ? "Unpin" : "Pin"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartRename();
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-(--ink) hover:bg-(--surface-inset) transition"
            >
              <PencilIcon className="size-4" />
              Rename
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-(--surface-inset) transition"
            >
              <Trash2Icon className="size-4" />
              Delete
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

function ThreadSidebar({
  threads,
  activeThreadId,
  loadingThreadId,
  search,
  onSearch,
  onNewChat,
  onSelectThread,
  onDeleteThread,
  onRenameThread,
  onPinThread,
  pinnedThreadIds,
  onCollapse,
  onOpenSearch,
}: {
  threads: ChatThreadSummary[];
  activeThreadId: string | null;
  loadingThreadId: string | null;
  search: string;
  onSearch: (value: string) => void;
  onNewChat: () => void;
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onRenameThread: (threadId: string, title: string) => void;
  onPinThread: (threadId: string) => void;
  pinnedThreadIds: string[];
  onCollapse?: () => void;
  onOpenSearch?: () => void;
}) {
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);

  const filteredThreads = threads.filter((thread) =>
    thread.title.toLowerCase().includes(search.toLowerCase()),
  );

  const sortedThreads = [...filteredThreads].sort((a, b) => {
    const aPinned = pinnedThreadIds.includes(a.id) ? 1 : 0;
    const bPinned = pinnedThreadIds.includes(b.id) ? 1 : 0;
    return bPinned - aPinned;
  });

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
            className="h-11 rounded-full border border-(--line-strong) bg-(--surface-panel-strong) pl-10 text-(--ink) placeholder:text-(--muted) shadow-(--shadow-soft) focus-visible:border-(--ink)"
          />
        </div>
      </div>

      <ScrollArea className="mt-4 min-h-0 flex-1 px-3">
        <div className="flex flex-col gap-1 pb-4">
          {sortedThreads.length === 0 ? (
            <p className="px-3 py-4 text-sm text-(--muted)">No threads yet.</p>
          ) : null}
          {sortedThreads.map((thread) => (
            <ThreadSidebarItem
              key={thread.id}
              thread={thread}
              isActive={activeThreadId === thread.id}
              isLoading={loadingThreadId === thread.id}
              isPinned={pinnedThreadIds.includes(thread.id)}
              renamingThreadId={renamingThreadId}
              onSelect={() => onSelectThread(thread.id)}
              onDelete={() => onDeleteThread(thread.id)}
              onRename={(title) => {
                setRenamingThreadId(null);
                if (title.trim() && title.trim() !== thread.title) {
                  onRenameThread(thread.id, title.trim());
                }
              }}
              onStartRename={() => setRenamingThreadId(thread.id)}
              onPin={() => onPinThread(thread.id)}
            />
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
            href="/chat/account"
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
    : !hasApiKeys
      ? "Add API keys to start"
      : "How can I help you?";
  const subtitle = isTemporary
    ? "Threads you create won’t save to your history and expire after 24 hours."
    : !hasApiKeys
      ? "Add your Anthropic or Google API key in Account Settings to enable the chat."
      : !hasSurveyContext
        ? "Ask about the Ciao platform, personality science, or methodology. Complete a survey to unlock personalised feedback."
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

      {isTemporary ? null : !hasApiKeys ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/chat/account" className={cn(clayPrimaryButton, "h-12")}>
            Go to Account Settings
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-10 grid w-full max-w-3xl gap-3 text-left sm:grid-cols-2">
            {(hasSurveyContext ? starterPrompts : genericStarterPrompts).map((prompt) => (
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
          {!hasSurveyContext ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/surveys/personality"
                className={cn(clayPrimaryButton, "h-11")}
              >
                Take Personality survey
              </Link>
              <Link
                href="/surveys/values-beliefs"
                className={cn(claySecondaryButton, "h-11")}
              >
                Take Values and Beliefs survey
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function ChatMessageBubble({
  message,
  onEdit,
}: {
  message: UIMessage;
  onEdit?: (text: string) => void;
}) {
  const isUser = message.role === "user";
  const text = getMessageText(message);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isUser) {
    return (
      <div className="group flex w-full justify-end gap-4">
        <div className="flex max-w-[min(760px,85%)] flex-col items-end gap-1">
          <div className="rounded-2xl border border-(--ink) bg-(--accent-blue) px-5 py-4 text-base leading-7 text-(--selected-contrast) shadow-(--shadow-soft)">
            <p className="whitespace-pre-wrap">{text}</p>
          </div>
          <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEdit?.(text)}
              title="Edit message"
              className="inline-flex size-7 items-center justify-center rounded-lg bg-(--accent-blue) text-(--selected-contrast) transition hover:brightness-90"
            >
              <PencilIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={copyText}
              title="Copy message"
              className="inline-flex size-7 items-center justify-center rounded-lg bg-(--accent-blue) text-(--selected-contrast) transition hover:brightness-90"
            >
              {copied ? <CheckIcon className="size-3.5 text-green-500" /> : <CopyIcon className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderedParts = message.parts.map((part, index) => {
    if (part.type === "text") {
      if (!part.text) return null;
      return <MarkdownRenderer key={`text-${index}`} text={part.text} />;
    }
    if (part.type === "reasoning") {
      const reasoningText = (part as { text?: string }).text ?? "";
      return <ReasoningPart key={`reasoning-${index}`} text={reasoningText} />;
    }
    if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
      return <ToolCallPart key={`tool-${index}`} part={part as ToolMessagePart} />;
    }
    return null;
  });

  const hasContent = renderedParts.some(Boolean);

  return (
    <div className="group flex w-full flex-col gap-1.5">
      <div className="flex items-center gap-1.5 pl-1">
        <CiaoIcon className="size-3.5 text-(--ink-soft)" />
        <span className="text-[11px] font-medium text-(--ink-soft)">Ask Ciao!</span>
      </div>
      <div className="flex max-w-[min(760px,85%)] flex-col gap-1">
        <div className="rounded-2xl border border-(--line-strong) bg-(--surface-panel-strong) px-5 py-4 text-base leading-7 text-(--ink) shadow-(--shadow-soft)">
          {hasContent ? (
            renderedParts
          ) : (
            <div className="flex items-center gap-2 text-(--ink-soft)">
              <ThinkingLottie className="size-5" />
              <span className="text-sm">Thinking...</span>
            </div>
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={copyText}
            title="Copy response"
            className="inline-flex size-7 items-center justify-center rounded-lg bg-(--surface-panel-strong) text-(--muted) transition hover:text-(--ink)"
          >
            {copied ? <CheckIcon className="size-3.5 text-green-500" /> : <CopyIcon className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setFeedback(feedback === "up" ? null : "up")}
            title="Good response"
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-lg bg-(--surface-panel-strong) transition",
              feedback === "up"
                ? "text-green-500"
                : "text-(--muted) hover:text-(--ink)",
            )}
          >
            <ThumbsUpIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setFeedback(feedback === "down" ? null : "down")}
            title="Poor response"
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-lg bg-(--surface-panel-strong) transition",
              feedback === "down"
                ? "text-red-500"
                : "text-(--muted) hover:text-(--ink)",
            )}
          >
            <ThumbsDownIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatShell({
  initialThreads,
  surveyContext: initialSurveyContext,
  apiKeyProviders,
  initialChatModel,
}: ChatShellProps) {
  const hasApiKeys = apiKeyProviders.anthropic || apiKeyProviders.google;
  const [chatModel, setChatModel] = useState(initialChatModel);
  // The model the server will actually run: if the saved model's provider has
  // no key but another does, fall back to a usable one so the picker label
  // matches what runs (and an Anthropic-only user on the Google default isn't
  // shown a model that 402s on every send).
  const effectiveModel = resolveUsableModel(chatModel, apiKeyProviders) ?? chatModel;
  // Mirror the effective model into a ref so the chat transport can read the
  // live selection at request time — the turn uses this, not a stale DB read,
  // so a message sent before the preference PUT commits still uses the model
  // the user just picked.
  const chatModelRef = useRef(effectiveModel);
  const handleChatModelChange = useCallback(async (next: string) => {
    const previous = chatModelRef.current;
    setChatModel(next);
    try {
      const response = await fetch("/api/account/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatModel: next }),
      });
      if (!response.ok) throw new Error("Failed to save model preference.");
    } catch {
      // Revert so the picker never claims a preference the server didn't store.
      setChatModel(previous);
      toast.error("Couldn't save your model preference.");
    }
  }, []);
  const [threads, setThreads] = useState(initialThreads);
  const [surveyContext, setSurveyContext] = useState(initialSurveyContext);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isTemporary, setIsTemporary] = useState(false);
  const [pinnedThreadIds, setPinnedThreadIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("ciao-pinned-threads") ?? "[]") as string[];
    } catch {
      return [];
    }
  });
  const sidebarLayout = useSidebarLayout();
  const [sidebarPeeked, setSidebarPeeked] = useState(false);
  const peekTimerRef = useRef<number>(0);
  const activeThreadRef = useRef<string | null>(null);
  const isTemporaryRef = useRef(false);

  const showSidebarPeek = useCallback(() => {
    window.clearTimeout(peekTimerRef.current);
    setSidebarPeeked(true);
  }, []);

  const hideSidebarPeek = useCallback((delay = 200) => {
    window.clearTimeout(peekTimerRef.current);
    peekTimerRef.current = window.setTimeout(() => setSidebarPeeked(false), delay);
  }, []);

  useEffect(() => {
    if (!sidebarLayout.collapsed) setSidebarPeeked(false);
  }, [sidebarLayout.collapsed]);

  useEffect(() => {
    return () => window.clearTimeout(peekTimerRef.current);
  }, []);

  useEffect(() => {
    chatModelRef.current = effectiveModel;
  }, [effectiveModel]);

  useEffect(() => {
    // Overwrite (don't delete-then-reset) on each toggle so the backdrop's
    // MutationObserver fires once per change. The previous cleanup deleted the
    // attribute on every toggle — not just unmount — causing a double observer
    // fire and a one-frame preset flicker.
    isTemporaryRef.current = isTemporary;
    document.documentElement.dataset.incognito = isTemporary ? "true" : "false";
  }, [isTemporary]);

  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.incognito;
    };
  }, []);
  const hasSurveyContext = surveyContextHasResults(surveyContext);

  useEffect(() => {
    if (hasSurveyContext) return;

    let cancelled = false;

    async function refreshSurveyContext() {
      try {
        const response = await fetch(SURVEY_CONTEXT_URL, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = (await response.json()) as { context?: SurveyChatContext };
        const nextContext = payload.context;

        if (!cancelled && nextContext && surveyContextHasResults(nextContext)) {
          setSurveyContext(nextContext);
        }
      } catch {
        // Server-rendered context remains the source of truth when the browser refresh fails.
      }
    }

    void refreshSurveyContext();

    return () => {
      cancelled = true;
    };
  }, [hasSurveyContext]);

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
          model: chatModelRef.current,
          surveyContext: surveyContextHasResults(surveyContext) ? surveyContext : undefined,
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
    [surveyContext],
  );

  const { messages, sendMessage, setMessages, status, stop, error } = useChat({
    id: "main-chat",
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
      setLoadingThreadId(threadId);

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
        setLoadingThreadId(null);
      }
    },
    [setMessages],
  );

  const submitPrompt = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || !hasApiKeys || isBusy) {
        return;
      }

      setInput("");

      try {
        await sendMessage({ text: prompt });
      } catch (sendError) {
        toast.error(sendError instanceof Error ? sendError.message : "Unable to send the message.");
      }
    },
    [hasApiKeys, isBusy, sendMessage],
  );

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      try {
        const response = await fetch(`/api/chat/threads/${threadId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete thread.");
        setThreads((prev) => prev.filter((t) => t.id !== threadId));
        if (activeThreadRef.current === threadId) {
          activeThreadRef.current = null;
          setActiveThreadId(null);
          setMessages([]);
        }
      } catch {
        toast.error("Unable to delete the chat.");
      }
    },
    [setMessages],
  );

  const handleRenameThread = useCallback(async (threadId: string, title: string) => {
    try {
      const response = await fetch(`/api/chat/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error("Failed to rename thread.");
      const payload = (await response.json()) as { thread: ChatThreadSummary };
      setThreads((prev) => prev.map((t) => (t.id === threadId ? payload.thread : t)));
    } catch {
      toast.error("Unable to rename the chat.");
    }
  }, []);

  const handlePinThread = useCallback((threadId: string) => {
    setPinnedThreadIds((prev) => {
      const next = prev.includes(threadId) ? prev.filter((id) => id !== threadId) : [...prev, threadId];
      try {
        localStorage.setItem("ciao-pinned-threads", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleEditMessage = useCallback((text: string) => {
    setInput(text);
  }, []);

  return (
    <TooltipProvider>
      <main
        className={cn(
          "fixed top-0 right-0 bottom-0 left-0 flex h-screen w-screen overflow-hidden p-3 text-(--ink) transition-colors",
          isTemporary && "incognito-bg",
        )}
        style={{ height: "100dvh", width: "100dvw" }}
      >
        <InteractiveDotBackground />
        {sidebarLayout.collapsed ? (
          <>
            <CollapsedSidebarToolbar
              onExpand={() => sidebarLayout.setCollapsed(false)}
              onSearch={() => setIsPaletteOpen(true)}
              onNewChat={startNewChat}
            />
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
              <ThreadSidebar
                threads={threads}
                activeThreadId={activeThreadId}
                loadingThreadId={loadingThreadId}
                search={search}
                onSearch={setSearch}
                onNewChat={() => {
                  setSidebarPeeked(false);
                  startNewChat();
                }}
                onSelectThread={(id) => {
                  setSidebarPeeked(false);
                  loadThread(id);
                }}
                onDeleteThread={handleDeleteThread}
                onRenameThread={handleRenameThread}
                onPinThread={handlePinThread}
                pinnedThreadIds={pinnedThreadIds}
                onCollapse={() => {
                  window.clearTimeout(peekTimerRef.current);
                  setSidebarPeeked(false);
                  sidebarLayout.setCollapsed(false);
                }}
                onOpenSearch={() => setIsPaletteOpen(true)}
              />
            </div>
          </>
        ) : (
          <div
            className="relative hidden shrink-0 border-r border-(--line-strong) lg:block"
            style={{ width: "280px" }}
          >
            <ThreadSidebar
              threads={threads}
              activeThreadId={activeThreadId}
              loadingThreadId={loadingThreadId}
              search={search}
              onSearch={setSearch}
              onNewChat={startNewChat}
              onSelectThread={loadThread}
              onDeleteThread={handleDeleteThread}
              onRenameThread={handleRenameThread}
              onPinThread={handlePinThread}
              pinnedThreadIds={pinnedThreadIds}
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
              className="absolute top-7 left-7 z-30 text-(--ink) hover:bg-(--surface-inset) lg:hidden"
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
              loadingThreadId={loadingThreadId}
              search={search}
              onSearch={setSearch}
              onNewChat={startNewChat}
              onSelectThread={loadThread}
              onDeleteThread={handleDeleteThread}
              onRenameThread={handleRenameThread}
              onPinThread={handlePinThread}
              pinnedThreadIds={pinnedThreadIds}
            />
          </SheetContent>
        </Sheet>

        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-20 flex shrink-0 justify-end px-4 pt-4">
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-(--line-strong) bg-(--surface-panel) p-1 shadow-(--shadow-soft) backdrop-blur">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={isTemporary ? "Turn off incognito mode" : "Use incognito"}
                    aria-pressed={isTemporary}
                    onClick={toggleTemporary}
                    className={cn(
                      "group incognito-toggle-btn inline-flex size-9 items-center justify-center rounded-xl text-(--ink) transition hover:bg-(--surface-inset)",
                      isTemporary &&
                        "bg-(--accent-blue) text-(--selected-contrast) hover:bg-(--accent-blue)",
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
            </div>
          </header>

          <div className="absolute bottom-4 left-4 z-30 flex flex-col items-center gap-1 rounded-2xl border border-(--line-strong) bg-(--surface-panel) p-1 shadow-(--shadow-soft) backdrop-blur">
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="/docs"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open Ciao Docs"
                  className="inline-flex size-9 items-center justify-center rounded-xl text-(--ink) transition hover:bg-(--surface-inset)"
                >
                  <DocsIcon className="size-5" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right">Open Ciao Docs</TooltipContent>
            </Tooltip>
            <SettingsMenu surveyContext={surveyContext} />
          </div>

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
                  <ChatMessageBubble
                    key={message.id}
                    message={message}
                    onEdit={message.role === "user" ? handleEditMessage : undefined}
                  />
                ))}
                {loadingThreadId ? (
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
                  disabled={!hasApiKeys || isBusy}
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
                    <ModelPicker
                      value={effectiveModel}
                      onChange={(next) => void handleChatModelChange(next)}
                      providers={apiKeyProviders}
                      disabled={isBusy}
                    />
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
                      disabled={!hasApiKeys || isBusy || !input.trim()}
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
