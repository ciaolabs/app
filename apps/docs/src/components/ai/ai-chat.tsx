"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAiSettings } from "@/lib/use-ai-settings";
import { AiSettings } from "./ai-settings";
import {
  ArrowUp,
  X,
  Settings,
  Loader2,
  Bot,
  User,
  Trash2,
} from "lucide-react";

function ChatMessages({
  messages,
  isLoading,
}: {
  messages: { id: string; role: string; content: string }[];
  isLoading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="rounded-full bg-fd-primary/10 p-3">
          <Bot className="size-6 text-fd-primary" />
        </div>
        <div>
          <p className="font-medium text-fd-foreground">Ask about the docs</p>
          <p className="mt-1 text-sm text-fd-muted-foreground">
            Questions about personality traits, values, beliefs, and assessment scales.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
                msg.role === "user"
                  ? "bg-fd-primary text-fd-primary-foreground"
                  : "bg-fd-muted text-fd-muted-foreground"
              }`}
            >
              {msg.role === "user" ? (
                <User className="size-3.5" />
              ) : (
                <Bot className="size-3.5" />
              )}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-fd-primary text-fd-primary-foreground"
                  : "bg-fd-muted text-fd-foreground"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-2.5">
            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-fd-muted text-fd-muted-foreground">
              <Bot className="size-3.5" />
            </div>
            <div className="rounded-2xl bg-fd-muted px-3.5 py-2.5">
              <Loader2 className="size-4 animate-spin text-fd-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function SidebarInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const safeInput = input ?? "";

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [safeInput]);

  return (
    <form onSubmit={onSubmit} className="border-t border-fd-border p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={safeInput}
          onChange={onInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
          placeholder="Ask a question..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground placeholder:text-fd-muted-foreground focus:border-fd-primary focus:outline-none focus:ring-1 focus:ring-fd-primary"
        />
        <button
          type="submit"
          disabled={!safeInput.trim() || isLoading}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-fd-primary text-fd-primary-foreground disabled:opacity-50 hover:bg-fd-primary/90"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </button>
      </div>
    </form>
  );
}

function Sidebar({
  onClose,
  initialQuery,
}: {
  onClose: () => void;
  initialQuery?: string;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const settings = useAiSettings();
  const hasSentInitial = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: () => ({
          "x-api-key": settingsRef.current.activeApiKey ?? "",
          ...(settingsRef.current.googleApiKey &&
          settingsRef.current.modelOption.provider !== "google"
            ? { "x-google-api-key": settingsRef.current.googleApiKey }
            : {}),
        }),
        body: () => ({
          model: settingsRef.current.model,
          provider: settingsRef.current.modelOption.provider,
        }),
      }),
    [],
  );

  const chat = useChat({ transport });

  useEffect(() => {
    if (initialQuery && settings.isReady && !hasSentInitial.current) {
      hasSentInitial.current = true;
      chat.append({ role: "user", content: initialQuery });
    }
  }, [initialQuery, settings.isReady]);

  useEffect(() => {
    if (!settings.isReady) {
      setShowSettings(true);
    }
  }, [settings.isReady]);

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="ai-sidebar-panel fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-fd-border bg-fd-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-fd-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-fd-primary" />
            <span className="text-sm font-semibold text-fd-foreground">Ask AI</span>
            <span className="rounded-full bg-fd-muted px-2 py-0.5 text-[10px] text-fd-muted-foreground">
              {settings.modelOption.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`rounded-lg p-1.5 transition-colors ${
                showSettings
                  ? "bg-fd-primary/10 text-fd-primary"
                  : "text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
              }`}
              title="Settings"
            >
              <Settings className="size-4" />
            </button>
            {chat.messages.length > 0 && (
              <button
                type="button"
                onClick={() => chat.setMessages([])}
                className="rounded-lg p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                title="Clear chat"
              >
                <Trash2 className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        {showSettings ? (
          <div className="flex-1 overflow-y-auto">
            <AiSettings onClose={() => setShowSettings(false)} />
          </div>
        ) : (
          <>
            <ChatMessages messages={chat.messages} isLoading={chat.isLoading} />
            <SidebarInput
              input={chat.input}
              isLoading={chat.isLoading}
              onInputChange={chat.handleInputChange}
              onSubmit={chat.handleSubmit}
            />
          </>
        )}
      </div>
    </>,
    document.body,
  );
}

function useContentBounds() {
  const [bounds, setBounds] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    function measure() {
      const article = document.querySelector("article");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      setBounds({ left: rect.left, width: rect.width });
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    const id = setInterval(measure, 1000);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      clearInterval(id);
    };
  }, []);

  return bounds;
}

function useNearBottom(threshold = 100) {
  const [nearBottom, setNearBottom] = useState(false);

  useEffect(() => {
    function check() {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const viewHeight = window.innerHeight;
      setNearBottom(scrollY + viewHeight >= docHeight - threshold);
    }

    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [threshold]);

  return nearBottom;
}

export function AiSearchBar() {
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentBounds = useContentBounds();
  const nearBottom = useNearBottom(150);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openSidebar = useCallback((withQuery?: string) => {
    setPendingQuery(withQuery);
    setSidebarOpen(true);
    setQuery("");
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {createPortal(
        <div
          className="fixed bottom-0 z-30 flex justify-center pb-4 pt-2 transition-opacity duration-300"
          style={{
            left: contentBounds?.left ?? 0,
            width: contentBounds?.width ?? "100%",
            opacity: nearBottom ? 0 : 1,
            pointerEvents: nearBottom ? "none" : "auto",
          }}
        >
          <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-fd-border bg-fd-card px-5 py-2.5 shadow-lg transition-colors focus-within:border-fd-primary focus-within:ring-1 focus-within:ring-fd-primary">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  openSidebar(query.trim());
                }
              }}
              placeholder="Ask a question..."
              className="flex-1 bg-transparent text-sm text-fd-foreground placeholder:text-fd-muted-foreground focus:outline-none"
            />
            <div className="flex items-center gap-1.5">
              <kbd className="hidden items-center gap-0.5 rounded border border-fd-border bg-fd-muted px-1.5 py-0.5 text-[10px] text-fd-muted-foreground sm:flex">
                Ctrl+I
              </kbd>
              <button
                type="button"
                onClick={() => openSidebar(undefined)}
                className="rounded-lg p-1.5 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
                title="Settings"
              >
                <Settings className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (query.trim()) {
                    openSidebar(query.trim());
                  } else {
                    openSidebar(undefined);
                  }
                }}
                className="flex size-7 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
              >
                <ArrowUp className="size-3.5" />
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {sidebarOpen && (
        <Sidebar
          onClose={() => {
            setSidebarOpen(false);
            setPendingQuery(undefined);
          }}
          initialQuery={pendingQuery}
        />
      )}
    </>
  );
}
