"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Lazy-load the Lottie player so its WASM/canvas runtime stays out of the
// landing-page critical bundle (this preview is decorative chrome).
const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((m) => ({ default: m.DotLottieReact })),
  { ssr: false },
);

type ChatScenario = "patterns" | "values" | "strengths";

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
      <path d="M43.8868 36.4415C39.2366 36.1663 34.5935 35.623 29.9504 35.6089C25.1026 35.5947 19.6974 34.4022 16.649 40.0191C16.5926 40.125 16.4374 40.1814 16.388 40.2873C15.8023 41.5786 14.9767 42.8276 14.7226 44.1824C14.4404 45.6784 16.1198 47.1108 18.3708 47.6824C23.4444 48.9808 28.6167 49.3195 33.8314 49.1431C35.525 49.1431 37.2255 49.1783 38.9191 49.1219C39.4624 49.1078 40.1822 49.0443 40.4997 48.7056C42.8283 46.2358 45.3404 43.879 46.4765 40.5342C47.2598 38.2197 46.1872 36.5685 43.8939 36.4345L43.8868 36.4415ZM28.2568 44.9233L27.4171 46.0876C24.2841 45.7066 21.645 45.4526 19.0482 45.0009C18.8365 44.9657 18.639 44.7822 18.4625 44.5493C18.0251 43.9848 18.1521 43.1663 18.7448 42.7923C18.9706 42.6512 19.1894 42.5524 19.4081 42.5594C21.9766 42.6582 24.5522 42.884 27.1067 43.1874C27.4242 43.2227 27.7206 43.3991 28.024 43.5967C28.4544 43.8931 28.5673 44.4929 28.2568 44.9233ZM29.7316 40.7883C29.5976 40.9153 29.4706 40.9929 29.3365 40.9929C28.0946 41.007 26.8597 40.7459 25.145 40.5342C24.5734 40.506 22.7035 40.379 21.6662 40.2096C21.645 40.2096 21.6238 40.2026 21.6027 40.1955C20.89 40.0262 21.1934 38.2974 21.8355 37.8316C21.9837 37.7258 22.1319 37.6552 22.273 37.6623C24.5734 37.7117 27.6641 38.1068 29.9574 38.3891C30.0068 38.3891 30.0562 38.4103 30.1056 38.4385C30.6843 38.756 30.2609 40.3014 29.7387 40.7883H29.7316ZM31.3828 45.9536C31.6298 44.133 32.4766 43.3074 34.5935 43.6249C36.6258 43.9284 38.7356 43.7943 40.9584 43.8649C40.528 47.2378 32.9494 46.7015 31.3828 45.9536ZM32.7588 40.5554C33.3798 39.0453 39.8153 38.6431 43.1671 39.9838C41.8687 42.1149 37.2044 42.3124 32.7588 40.5554Z" fill="currentColor" />
      <path d="M62.2406 6.93164C62.0148 4.99819 62.0289 2.41554 59.4181 1.90042C55.3254 1.08893 51.1832 0.545589 47.0341 0.0445839C45.6863 -0.117714 44.2821 0.206882 42.899 0.319784C35.9343 0.856072 28.9626 1.30063 22.0191 2.01332C20.8618 2.13328 19.38 3.16352 18.8155 4.19376C16.7691 7.91249 16.4445 12.1252 16.4445 16.2602C16.4445 20.3459 17.0302 24.4315 17.2137 28.5243C17.2489 29.2864 16.7903 30.2743 16.2399 30.8317C13.9536 33.118 11.6038 35.3549 9.15524 37.4647C5.9234 40.252 2.95265 43.1804 1.65427 47.4143C1.44258 48.1129 1.16032 48.8256 0.736935 49.4042C-0.483824 51.0836 -0.222737 52.3256 1.78128 53.0312C3.24902 53.5534 4.80143 53.885 6.33973 54.1602C13.008 55.3457 19.6834 56.4818 25.766 57.5332C31.2983 57.0322 36.1178 56.5171 40.9514 56.1854C42.7579 56.0584 44.0633 55.3104 45.1147 53.9626C46.9635 51.5846 48.7347 49.1431 50.6187 46.7933C54.2316 42.2913 57.2094 37.4295 59.0159 31.9255C59.4745 30.5283 59.2417 28.8489 59.8979 27.5928C61.7043 24.0928 62.5793 20.4164 62.6076 16.5354C62.6287 13.3318 62.6287 10.1 62.2547 6.93164H62.2406ZM50.1601 42.2772C48.4101 44.3377 46.9988 46.6945 45.5028 48.9667C43.6117 51.8316 41.0361 53.1441 37.5644 53.4828C31.6017 54.0614 25.6602 54.4354 19.7257 53.4969C14.7792 52.7137 9.87499 51.6623 4.94961 50.7449C3.58773 50.4909 3.36898 49.7429 3.89115 48.5786C5.79638 44.3165 8.43548 40.7107 12.3659 38.001C14.5746 36.4839 16.3739 34.3811 18.4626 32.6664C19.0977 32.1442 20.0927 31.742 20.883 31.7914C31.8063 32.5535 42.7297 32.9275 53.653 31.7914C54.1187 31.742 54.6056 31.869 55.3042 31.9396C54.1116 35.8982 52.6721 39.3135 50.1601 42.2702V42.2772ZM58.7618 22.9779C58.3455 24.742 57.2165 26.3791 56.1862 27.9174C55.8193 28.4678 54.782 28.7995 54.034 28.8206C47.2458 29.0323 40.4504 29.2017 33.6622 29.3005C31.3194 29.3358 28.9838 29.3005 26.641 29.2299C20.9394 29.0676 20.3326 29.5333 19.8034 25.8852C19.5564 24.1916 19.4435 22.4769 19.3235 20.7622C19.2247 19.365 19.2318 17.9679 19.3376 16.5778L20.0645 7.24213C20.1774 6.48003 21.5392 5.53447 22.4707 5.32984C25.3497 4.68065 28.2852 4.24315 31.2206 3.91856C35.264 3.474 39.3285 2.88832 43.3788 2.94477C47.4998 2.99417 51.6348 3.61513 55.7205 4.22198C58.7195 4.67359 59.03 5.32984 59.4675 8.32176C60.1872 13.2612 59.905 18.1655 58.7618 22.9709V22.9779Z" fill="currentColor" />
      <path d="M52.2445 25.5676C53.0317 24.392 53.8945 23.141 54.2126 21.7929V21.7875C55.0862 18.1154 55.3019 14.3677 54.7519 10.5931C54.4176 8.30679 54.1803 7.80531 51.8886 7.4602L51.7784 7.44384C48.6921 6.98536 45.5695 6.5215 42.4574 6.48419C39.3622 6.44106 36.2563 6.88862 33.1665 7.22833C30.9233 7.47638 28.6801 7.8107 26.48 8.30679C25.7682 8.46317 24.7275 9.18574 24.6413 9.76811L24.0858 16.9021C24.005 17.9644 23.9996 19.0321 24.0751 20.0998C24.1667 21.4101 24.253 22.7204 24.4417 24.0146C24.8462 26.8024 25.3099 26.4465 29.6669 26.5705C31.4571 26.6244 33.242 26.6514 35.0322 26.6244C40.2196 26.549 45.4124 26.4195 50.5998 26.2578C51.1714 26.2416 51.9641 25.9882 52.2445 25.5676Z" fill="currentColor" />
    </svg>
  );
}

function ThinkingLottie({ className }: { className?: string }) {
  return (
    <DotLottieReact
      src="/loading.lottie"
      loop
      autoplay
      className={className}
      aria-label="Ciao! is waving"
    />
  );
}

function WavingDots() {
  // CSS-animated dots: no perpetual setInterval / React re-render on this static
  // marketing preview, and the browser pauses the animation when off-screen.
  return (
    <span aria-hidden="true" className="inline-flex">
      {[0, 1, 2].map((i) => (
        <span key={i} className="ciao-wave-dot" style={{ animationDelay: `${i * 0.18}s` }}>
          .
        </span>
      ))}
    </span>
  );
}

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; segments: ChatSegment[] };

type ChatSegment =
  | { kind: "text"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "callout"; title: string; body: string };

type ChatTurn = {
  prompt: string;
  response: ChatSegment[];
};

type ThreadItem = {
  id: string;
  title: string;
  preview: string;
  date: string;
  active?: boolean;
  pinned?: boolean;
};

const scenarios: Record<ChatScenario, { label: string; conversation: ChatTurn[] }> = {
  patterns: {
    label: "What patterns stand out in my personality results?",
    conversation: [
      {
        prompt: "What patterns stand out in my personality results?",
        response: [
          {
            kind: "text",
            text:
              "Looking across your three frameworks, a few patterns stand out clearly:",
          },
          {
            kind: "list",
            items: [
              "High Openness paired with low Anxiety — you explore ideas without feeling overwhelmed.",
              "Honesty-Humility (HEXACO) sits in the 90th percentile, reinforcing the same picture from your NEO Empathy score.",
              "Social-facing traits diverge: Warmth is high, Assertiveness is low — you connect easily but rarely lead.",
            ],
          },
          {
            kind: "callout",
            title: "Reading",
            body:
              "You tend toward thoughtful, principled curiosity. Comfortable in depth, less drawn to the spotlight.",
          },
        ],
      },
    ],
  },
  values: {
    label: "How do my values and beliefs interact?",
    conversation: [
      {
        prompt: "How do my values and beliefs interact?",
        response: [
          {
            kind: "text",
            text:
              "Your Universalism and Benevolence (Schwartz) are both high, and they line up with a strong belief that people can generally be trusted.",
          },
          {
            kind: "list",
            items: [
              "You score low on Power and Tradition — you don’t lean on hierarchy or inherited norms to make decisions.",
              "Self-Direction is in the 88th percentile, which fits your Openness from the personality side.",
              "Belief: “The world is generally a safe place.” — agreed strongly, consistent with low Anxiety.",
            ],
          },
        ],
      },
    ],
  },
  strengths: {
    label: "What strengths should I lean into?",
    conversation: [
      {
        prompt: "What strengths should I lean into?",
        response: [
          {
            kind: "text",
            text:
              "Three strengths that show up repeatedly across your scores:",
          },
          {
            kind: "list",
            items: [
              "Imagination — 92nd percentile. You generate ideas others miss.",
              "Honesty-Humility — your collaborators will sense it without you having to prove it.",
              "Well-being (MPQ) — emotional baseline is unusually steady; you’re a calm anchor in groups.",
            ],
          },
          {
            kind: "callout",
            title: "Where to lean in",
            body:
              "Roles that pair deep thinking with quiet trust-building — research, mentorship, long-horizon design work.",
          },
        ],
      },
    ],
  },
};

const threads: ThreadItem[] = [
  {
    id: "t-active",
    title: "Reflecting on my results",
    preview: "Looking across your three frameworks…",
    date: "Today",
    active: true,
  },
  {
    id: "t-3",
    title: "Communication style",
    preview: "Warmth + low Assertiveness suggests…",
    date: "Apr 22",
  },
  {
    id: "t-4",
    title: "Stress patterns",
    preview: "Your low Anxiety doesn’t mean…",
    date: "Apr 14",
  },
  {
    id: "t-5",
    title: "Comparing NEO vs HEXACO",
    preview: "These overlap on Honesty…",
    date: "Apr 02",
  },
];

const starterPrompts: { id: ChatScenario; label: string }[] = [
  { id: "patterns", label: "What patterns stand out in my personality results?" },
  { id: "values", label: "How do my values and beliefs interact?" },
  { id: "strengths", label: "What strengths should I lean into?" },
];

function AssistantSegments({ segments }: { segments: ChatSegment[] }) {
  return (
    <div className="space-y-3 text-base leading-7 text-(--ink)">
      {segments.map((segment, index) => {
        if (segment.kind === "text") {
          return (
            <p key={index} className="whitespace-pre-wrap">
              {segment.text}
            </p>
          );
        }
        if (segment.kind === "list") {
          return (
            <ul key={index} className="space-y-2 pl-1">
              {segment.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--accent-mint)"
                  />
                  <span className="text-(--ink-soft)">{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <div
            key={index}
            className="rounded-2xl border border-dashed border-(--line-strong) bg-(--surface-panel) px-4 py-3"
          >
            <p className="clay-label">{segment.title}</p>
            <p className="mt-1.5 text-sm leading-6 text-(--ink)">{segment.body}</p>
          </div>
        );
      })}
    </div>
  );
}

export function SurveyChatPreview() {
  const [scenario, setScenario] = useState<ChatScenario>("patterns");
  const conversation = scenarios[scenario].conversation;
  const messages: ChatMessage[] = conversation.flatMap((turn, turnIndex) => [
    { id: `u-${turnIndex}`, role: "user", text: turn.prompt },
    { id: `a-${turnIndex}`, role: "assistant", segments: turn.response },
  ]);

  return (
    <div className="overflow-hidden rounded-4xl border border-(--line) bg-(--surface-panel-strong) shadow-(--shadow-strong) backdrop-blur">
      {/* Safari-style mac toolbar */}
      <div className="flex items-center gap-3 border-b border-(--line) bg-(--surface-panel-strong) px-4 py-3 sm:px-5">
        <div className="flex items-center gap-1.5">
          <span className="block h-3 w-3 rounded-full" style={{ background: "#FF5F57" }} />
          <span className="block h-3 w-3 rounded-full" style={{ background: "#FEBC2E" }} />
          <span className="block h-3 w-3 rounded-full" style={{ background: "#28C840" }} />
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            aria-label="Toggle sidebar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--muted) transition hover:bg-(--surface-inset) hover:text-(--ink)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.6">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <line x1="9" y1="5" x2="9" y2="19" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Sidebar options"
            className="inline-flex h-7 w-5 items-center justify-center rounded-md text-(--muted) transition hover:bg-(--surface-inset) hover:text-(--ink)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3 fill-current">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center rounded-full bg-(--surface-inset) p-0.5">
          <button
            type="button"
            aria-label="Back"
            className="inline-flex h-7 w-8 items-center justify-center rounded-full text-(--muted) transition hover:text-(--ink)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Forward"
            className="inline-flex h-7 w-8 items-center justify-center rounded-full text-(--muted) transition hover:text-(--ink)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center rounded-full bg-(--surface-inset) px-4 py-1.5 text-xs text-(--ink-soft)">
          <span className="truncate">platform.ciaobang.com/chat</span>
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            aria-label="New tab"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--muted) transition hover:bg-(--surface-inset) hover:text-(--ink)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M6.84814 13.9785C7.25488 13.9785 7.59521 13.6548 7.59521 13.2563V7.73633H12.9575C13.356 7.73633 13.6963 7.396 13.6963 6.98926C13.6963 6.58252 13.356 6.25049 12.9575 6.25049H7.59521V0.722168C7.59521 0.32373 7.25488 0 6.84814 0C6.44141 0 6.10938 0.32373 6.10938 0.722168V6.25049H0.73877C0.340332 6.25049 0 6.58252 0 6.98926C0 7.396 0.340332 7.73633 0.73877 7.73633H6.10938V13.2563C6.10938 13.6548 6.44141 13.9785 6.84814 13.9785Z" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Show all tabs"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--muted) transition hover:bg-(--surface-inset) hover:text-(--ink)"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M2.60645 13.5469H4.02588V14.8169C4.02588 16.5269 4.88916 17.3901 6.63232 17.3901H14.9663C16.6929 17.3901 17.5645 16.5269 17.5645 14.8169V6.4165C17.5645 4.70654 16.6929 3.84326 14.9663 3.84326H13.5386V2.57324C13.5386 0.863281 12.667 0 10.9404 0H2.60645C0.863281 0 0 0.863281 0 2.57324V10.9736C0 12.6836 0.863281 13.5469 2.60645 13.5469ZM2.62305 12.2104C1.79297 12.2104 1.33643 11.7622 1.33643 10.8989V2.64795C1.33643 1.78467 1.79297 1.33643 2.62305 1.33643H10.9155C11.7373 1.33643 12.2021 1.78467 12.2021 2.64795V3.84326H6.63232C4.88916 3.84326 4.02588 4.69824 4.02588 6.4165V12.2104H2.62305ZM6.64893 16.0537C5.82715 16.0537 5.3623 15.6055 5.3623 14.7422V6.49121C5.3623 5.62793 5.82715 5.17969 6.64893 5.17969H14.9414C15.7632 5.17969 16.228 5.62793 16.228 6.49121V14.7422C16.228 15.6055 15.7632 16.0537 14.9414 16.0537H6.64893Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="bg-(--surface-panel) p-3 sm:p-4">
        <div className="grid min-h-136 gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-(--line) bg-(--surface-panel-strong) p-5 shadow-(--shadow-soft)">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 p-3 backdrop-blur-sm">
                  <CiaoIcon className="size-6 text-(--ink)" />
                </span>
                <p className="font-display text-base font-bold text-(--ink)">Ask Ciao!</p>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Search"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--muted) transition hover:bg-(--surface-inset) hover:text-(--ink)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="New chat"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--muted) transition hover:bg-(--surface-inset) hover:text-(--ink)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="button"
              className="clay-button-hover mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-black bg-(--accent-blue) text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              New chat
            </button>

            <div className="relative mt-4">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-current text-(--muted)"
                viewBox="0 0 24 24"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <div className="flex h-10 items-center rounded-full border border-(--line-strong) bg-(--surface-panel) pl-9 pr-3 text-xs text-(--muted) shadow-(--shadow-soft)">
                Search your threads…
              </div>
            </div>

            <div className="relative mt-5 hidden min-h-0 flex-1 overflow-hidden lg:block">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-[linear-gradient(0deg,var(--surface-panel-strong)_0%,rgba(255,255,255,0)_100%)] [html[data-theme='dark']_&]:bg-[linear-gradient(0deg,var(--surface-panel-strong)_0%,rgba(0,0,0,0)_100%)]"
              />
              <ol className="flex max-h-104 flex-col gap-1.5 overflow-hidden pr-1">
                {threads.map((thread) => (
                  <li key={thread.id}>
                    <div
                      className={[
                        "rounded-2xl border px-3 py-2.5 text-left transition",
                        thread.active
                          ? "border-(--line-strong) bg-(--accent-soft)"
                          : "border-transparent hover:border-(--line) hover:bg-(--surface-inset)",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2">
                        {thread.pinned ? (
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0 -rotate-45 fill-none stroke-current text-(--ink-soft)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 17v5" />
                            <path d="M5 11l7-7 7 7-3 2v3l-4 4-4-4v-3z" />
                          </svg>
                        ) : null}
                        <p className="line-clamp-1 flex-1 text-sm font-semibold text-(--ink)">
                          {thread.title}
                        </p>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--muted)">
                          {thread.date}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-(--muted)">
                        {thread.preview}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-3 hidden items-center gap-2.5 rounded-2xl border border-(--line) bg-(--surface-panel) p-2 shadow-(--shadow-soft) lg:flex">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--line-strong) bg-(--surface-panel-strong) text-sm font-bold text-(--ink)">
                M
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-(--ink)">Marco Rossi</p>
                <p className="truncate text-[10px] text-(--muted)">Free plan</p>
              </div>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 fill-none stroke-current text-(--muted)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 9l5-5 5 5" />
                <path d="M7 15l5 5 5-5" />
              </svg>
            </div>
          </aside>

          {/* Chat area */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-(--line) bg-(--surface-panel-strong) shadow-(--shadow-soft)">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--line) px-5 py-4 sm:px-7">
              <div className="flex flex-wrap items-center gap-2">
                <p className="clay-label">Conversation</p>
                <span className="rounded-full border border-dashed border-(--line) bg-(--surface-panel) px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--ink)">
                  Personality + Values
                </span>
              </div>
              <div className="inline-flex rounded-full border border-(--line) bg-(--surface-panel) p-1 shadow-(--shadow-soft)">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => setScenario(prompt.id)}
                    aria-pressed={scenario === prompt.id}
                    className={[
                      "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition",
                      scenario === prompt.id
                        ? "bg-(--accent-coral) text-(--selected-contrast) shadow-(--shadow-soft)"
                        : "text-(--ink-soft) hover:text-(--ink)",
                    ].join(" ")}
                  >
                    {prompt.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-5 py-6 sm:px-7">
              {messages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex w-full justify-end">
                    <div className="max-w-[min(560px,85%)] rounded-2xl border border-(--ink) bg-(--accent-blue) px-5 py-3 text-base leading-7 text-(--selected-contrast) shadow-(--shadow-soft)">
                      {message.text}
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <CiaoIcon className="size-3.5 text-(--muted)" />
                      <span className="text-[11px] font-medium text-(--muted)">
                        Ask Ciao!
                      </span>
                    </div>
                    <div className="pl-0.5">
                      <AssistantSegments segments={message.segments} />
                    </div>
                  </div>
                ),
              )}
              <div className="flex items-center gap-2 pl-0.5">
                <ThinkingLottie className="size-5" />
                <span className="text-[12px] text-(--muted)">
                  Waving<WavingDots />
                </span>
              </div>
            </div>

            <div className="border-t border-(--line) px-5 py-4 sm:px-7">
              <div className="rounded-3xl border border-(--line-strong) bg-(--surface-panel) p-3 shadow-(--shadow-soft)">
                <div className="flex min-h-12 items-start px-2 py-1 text-sm text-(--muted)">
                  Ask a follow-up about your results…
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex min-w-0 items-center gap-2 text-xs text-(--ink-soft)">
                    <span className="truncate font-semibold text-(--ink)">
                      Personality + Values
                    </span>
                    <span aria-hidden="true" className="h-3 w-px bg-(--line)" />
                    <span className="inline-flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 font-semibold text-(--ink)">
                      Claude Sonnet 4.6
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-3 w-3 fill-none stroke-current text-(--muted)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7 9l5-5 5 5" />
                        <path d="M7 15l5 5 5-5" />
                      </svg>
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label="Send message"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--ink) bg-(--accent-blue) text-(--selected-contrast) shadow-(--shadow-soft)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-4 w-4 fill-none stroke-current"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 19V5" />
                      <path d="M5 12l7-7 7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
