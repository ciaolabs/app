"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useAiSettings } from "@/lib/use-ai-settings";
import { AiSettings } from "./ai-settings";
import {
  ArrowRight,
  Settings,
  Loader2,
  Bot,
  Edit,
  ChevronDown,
} from "lucide-react";

function messageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function ChatMessages({
  messages,
  isLoading,
}: {
  messages: UIMessage[];
  isLoading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <div className="rounded-full bg-white/10 p-3 backdrop-blur-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ciao-sparkle-dark.svg"
            alt=""
            aria-hidden="true"
            className="ciao-wave"
            style={{ height: 24, width: 24, objectFit: "contain" }}
          />
        </div>
        <div>
          <p className="font-medium text-white/90">Ask about the docs</p>
          <p className="mt-1 text-sm text-white/50">
            Questions about personality traits, values, beliefs, and assessment
            scales.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <div className="space-y-5">
        {messages.map((msg) => {
          const text = messageText(msg);
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl bg-white/15 px-4 py-3 text-[13px] leading-relaxed text-white backdrop-blur-sm">
                  {text}
                </div>
              </div>
            );
          }
          return (
            <div key={msg.id} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Bot className="size-3.5 text-white/50" />
                <span className="text-[11px] font-medium text-white/50">
                  AI
                </span>
              </div>
              <div className="pl-0.5 text-[13px] leading-relaxed text-white/85">
                <div className="whitespace-pre-wrap">{text}</div>
              </div>
            </div>
          );
        })}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Bot className="size-3.5 text-white/50" />
              <span className="text-[11px] font-medium text-white/50">AI</span>
            </div>
            <div className="flex items-center gap-2 pl-0.5">
              <Loader2 className="size-3.5 animate-spin text-white/50" />
              <span className="text-[12px] text-white/40">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function useContentBounds() {
  const [bounds, setBounds] = useState<{ left: number; width: number } | null>(
    null,
  );

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
  const [expanded, setExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentBounds = useContentBounds();
  const nearBottom = useNearBottom(150);

  const settings = useAiSettings();
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
  const [input, setInput] = useState("");
  const isLoading = chat.status === "submitted" || chat.status === "streaming";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (expanded && !settings.isReady) {
      setShowSettings(true);
    }
  }, [expanded, settings.isReady]);

  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      setInput("");
      if (!expanded) setExpanded(true);
      void chat.sendMessage({ text: trimmed });
    },
    [isLoading, expanded, chat],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        if (expanded) {
          textareaRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }
      if (e.key === "Escape" && expanded) {
        setExpanded(false);
        setShowSettings(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [expanded]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed bottom-0 z-30 flex justify-center pb-4 pt-2 transition-opacity duration-300"
      style={{
        left: contentBounds?.left ?? 0,
        width: contentBounds?.width ?? "100%",
        opacity: nearBottom && !expanded ? 0 : 1,
        pointerEvents: nearBottom && !expanded ? "none" : "auto",
      }}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/[0.06] shadow-2xl transition-all duration-300 ease-out"
        style={{
          maxHeight: expanded ? "min(75vh, 620px)" : "3rem",
          background: expanded
            ? "rgba(20, 20, 20, 0.6)"
            : "rgba(20, 20, 20, 0.5)",
          backdropFilter: "blur(40px) saturate(2)",
          WebkitBackdropFilter: "blur(40px) saturate(2)",
        }}
      >
        {expanded && (
          <>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
              <div className="flex shrink-0 items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ciao-sparkle-dark.svg"
                  alt=""
                  aria-hidden="true"
                  className="ciao-wave"
                  style={{ height: 24, width: 24, objectFit: "contain" }}
                />
                <span className="text-[13px] font-medium leading-none text-white/80">
                  Ask
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ciao-text.png"
                  alt="Ciao!"
                  style={{ height: 16, width: "auto", filter: "invert(1)" }}
                />
                <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-white/40">
                  {settings.modelOption.label}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`rounded-lg p-1.5 transition-colors ${
                    showSettings
                      ? "bg-white/10 text-white/70"
                      : "text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                  }`}
                  title="Settings"
                >
                  <Settings className="size-3.5" />
                </button>
                {chat.messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => chat.setMessages([])}
                    className="rounded-lg p-1.5 text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                    title="New chat"
                  >
                    <Edit className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    setShowSettings(false);
                  }}
                  className="rounded-lg p-1.5 text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                  title="Collapse"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Body: settings or messages */}
            {showSettings ? (
              <div className="flex-1 overflow-y-auto [&_*]:!border-white/[0.08] [&_h3]:!text-white/80 [&_h4]:!text-white/70 [&_input]:!bg-white/[0.06] [&_input]:!text-white/80 [&_input]:placeholder:!text-white/30 [&_label]:!text-white/70 [&_p]:!text-white/50 [&_select]:!bg-white/[0.06] [&_select]:!text-white/80 [&_span]:!text-white/50">
                <AiSettings onClose={() => setShowSettings(false)} />
              </div>
            ) : (
              <ChatMessages messages={chat.messages} isLoading={isLoading} />
            )}

            {/* Expanded input */}
            {!showSettings && (
              <div className="shrink-0 border-t border-white/[0.06] p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(input);
                      }
                    }}
                    placeholder="Ask a question..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-[13px] text-white/80 placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-0"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubmit(input);
                    }}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/80 backdrop-blur-sm transition-colors disabled:opacity-30 hover:bg-white/25"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Collapsed bar */}
        {!expanded && (
          <div className="flex items-center gap-2 px-5 py-2.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  handleSubmit(input.trim());
                }
              }}
              placeholder="Ask a question..."
              className="flex-1 bg-transparent text-[13px] text-white/80 placeholder:text-white/40 focus:outline-none"
            />
            <div className="flex items-center gap-1.5">
              <kbd className="hidden items-center gap-0.5 rounded border border-white/[0.08] bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/30 sm:flex">
                Ctrl+I
              </kbd>
              <button
                type="button"
                onClick={() => {
                  if (input.trim()) {
                    handleSubmit(input.trim());
                  } else {
                    setExpanded(true);
                  }
                }}
                className="flex size-7 items-center justify-center rounded-full bg-white/15 text-white/80 transition-colors hover:bg-white/25"
              >
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
