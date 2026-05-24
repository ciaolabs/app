"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useAiSettings } from "@/lib/use-ai-settings";
import { AiSettings } from "./ai-settings";
import {
  ArrowRight,
  Settings,
  Loader2,
  Edit,
  ChevronDown,
  Maximize2,
} from "lucide-react";

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
      <path d="M43.8868 36.4415C39.2366 36.1663 34.5935 35.623 29.9504 35.6089C25.1026 35.5947 19.6974 34.4022 16.649 40.0191C16.5926 40.125 16.4374 40.1814 16.388 40.2873C15.8023 41.5786 14.9767 42.8276 14.7226 44.1824C14.4404 45.6784 16.1198 47.1108 18.3708 47.6824C23.4444 48.9808 28.6167 49.3195 33.8314 49.1431C35.525 49.1431 37.2255 49.1783 38.9191 49.1219C39.4624 49.1078 40.1822 49.0443 40.4997 48.7056C42.8283 46.2358 45.3404 43.879 46.4765 40.5342C47.2598 38.2197 46.1872 36.5685 43.8939 36.4345L43.8868 36.4415Z" fill="currentColor"/>
      <path d="M62.2406 6.93164C62.0148 4.99819 62.0289 2.41554 59.4181 1.90042C55.3254 1.08893 51.1832 0.545589 47.0341 0.0445839C45.6863 -0.117714 44.2821 0.206882 42.899 0.319784C35.9343 0.856072 28.9626 1.30063 22.0191 2.01332C20.8618 2.13328 19.38 3.16352 18.8155 4.19376C16.7691 7.91248 16.4445 12.1252 16.4445 16.2602C16.4445 20.3459 17.0302 24.4315 17.2137 28.5243C17.2489 29.2864 16.7903 30.2743 16.2399 30.8317C13.9536 33.118 11.6038 35.3549 9.15524 37.4647C5.9234 40.252 2.95265 43.1804 1.65427 47.4143C1.44258 48.1129 1.16032 48.8256 0.736935 49.4042C-0.483824 51.0836 -0.222737 52.3256 1.78128 53.0312C3.24902 53.5534 4.80143 53.885 6.33973 54.1602C13.008 55.3457 19.6834 56.4818 25.766 57.5332C31.2983 57.0322 36.1178 56.5171 40.9514 56.1854C42.7579 56.0584 44.0633 55.3104 45.1147 53.9626C46.9635 51.5846 48.7347 49.1431 50.6187 46.7933C54.2316 42.2913 57.2094 37.4295 59.0159 31.9255C59.4745 30.5283 59.2417 28.8489 59.8979 27.5928C61.7043 24.0928 62.5793 20.4164 62.6076 16.5354C62.6287 13.3318 62.6287 10.1 62.2547 6.93164H62.2406Z" fill="currentColor"/>
    </svg>
  );
}

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
          <CiaoIcon className="size-6 text-white/80" />
        </div>
        <div>
          <p className="font-medium text-white/90">Ask Ciao!</p>
          <p className="mt-1 text-sm text-white/50">
            Questions about your surveys, personality results, values, and beliefs.
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
                <div className="ai-user-bubble max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed backdrop-blur-sm">
                  {text}
                </div>
              </div>
            );
          }
          return (
            <div key={msg.id} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CiaoIcon className="size-3.5 text-white/50" />
                <span className="text-[11px] font-medium text-white/50">
                  Ask Ciao!
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
              <CiaoIcon className="size-3.5 text-white/50" />
              <span className="text-[11px] font-medium text-white/50">Ask Ciao!</span>
            </div>
            <div className="flex items-center gap-2 pl-0.5">
              <ThinkingLottie className="size-5" />
              <span className="text-[12px] text-white/40">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 pt-2 transition-opacity duration-300"
      style={{
        opacity: nearBottom && !expanded ? 0 : 1,
      }}
    >
      <div
        className={`ai-pill pointer-events-auto flex w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ease-out${expanded ? " ai-pill--expanded" : ""}`}
        style={{
          maxHeight: expanded ? "min(75vh, 620px)" : "3rem",
          pointerEvents: nearBottom && !expanded ? "none" : "auto",
        }}
      >
        {expanded && (
          <>
            <div className="ai-divider-b flex shrink-0 items-center justify-between px-4 py-2.5">
              <div className="flex shrink-0 items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ciao-sparkle.svg"
                  alt=""
                  aria-hidden="true"
                  className="ciao-wave ai-pill-sparkle-light"
                  style={{ height: 24, width: 24, objectFit: "contain" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ciao-sparkle-dark.svg"
                  alt=""
                  aria-hidden="true"
                  className="ciao-wave ai-pill-sparkle-dark"
                  style={{ height: 24, width: 24, objectFit: "contain" }}
                />
                <span className="text-[13px] font-medium leading-none text-white/80">
                  Ask
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ciao-text.png"
                  alt="Ciao!"
                  className="ai-pill-logo"
                  style={{ height: 16, width: "auto" }}
                />
                <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-white/40">
                  {settings.modelOption.label}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <a
                  href="https://app.ciaobang.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                  title="Open full chat in app.ciaobang.com"
                >
                  <Maximize2 className="size-3.5" />
                </a>
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

            {showSettings ? (
              <div className="flex-1 overflow-y-auto text-white/80">
                <AiSettings onClose={() => setShowSettings(false)} />
              </div>
            ) : (
              <ChatMessages messages={chat.messages} isLoading={isLoading} />
            )}

            {!showSettings && (
              <div className="ai-divider-t shrink-0 p-3">
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
                    className="ai-chat-input ai-pill-textarea flex-1 resize-none overflow-hidden rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-0"
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
              placeholder="Ask Ciao!"
              className="ai-chat-input ai-pill-input flex-1 bg-transparent text-[13px] outline-none"
            />
            <div className="flex items-center gap-1.5">
              <kbd className="ai-pill-kbd hidden items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] sm:flex">
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
                className="ai-pill-btn flex size-7 items-center justify-center rounded-full transition-colors"
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
