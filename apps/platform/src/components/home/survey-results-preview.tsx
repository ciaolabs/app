"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  DashboardGauge,
  SegmentedScoreBar,
} from "@/components/dashboard/dashboard-metrics";
import { type ScoreBand } from "@/lib/survey/results/types";

type RankingMode = "highest" | "lowest";
type FrameworkId = "NEO" | "HEXACO" | "MPQ";

type GaugeSample = {
  id: string;
  label: string;
  score: number;
  band: ScoreBand;
  median: number;
  iqrStart: number;
  iqrEnd: number;
};

type RankingSample = {
  code: string;
  displayName: string;
  inventoryLabel: string;
  description: string;
  score: number;
  percentile: number;
  band: ScoreBand;
};

const overviewSamples: GaugeSample[] = [
  {
    id: "openness",
    label: "Openness",
    score: 42,
    band: "High",
    median: 30,
    iqrStart: 24,
    iqrEnd: 38,
  },
  {
    id: "conscientiousness",
    label: "Conscientiousness",
    score: 35,
    band: "Middle",
    median: 32,
    iqrStart: 25,
    iqrEnd: 39,
  },
  {
    id: "extraversion",
    label: "Extraversion",
    score: 18,
    band: "Low",
    median: 28,
    iqrStart: 22,
    iqrEnd: 36,
  },
];

const rankingsByFramework: Record<FrameworkId, Record<RankingMode, RankingSample[]>> = {
  NEO: {
    highest: [
      {
        code: "imagination",
        displayName: "Imagination",
        inventoryLabel: "NEO",
        description: "Tendency to entertain new ideas, fantasize, and engage with rich inner experiences.",
        score: 45,
        percentile: 92,
        band: "High",
      },
      {
        code: "empathy",
        displayName: "Empathy",
        inventoryLabel: "NEO",
        description: "Capacity to recognize and share the emotions and perspectives of others.",
        score: 36,
        percentile: 64,
        band: "Middle",
      },
      {
        code: "assertiveness",
        displayName: "Assertiveness",
        inventoryLabel: "NEO",
        description: "Comfort directing groups, voicing opinions, and stepping into leadership roles.",
        score: 16,
        percentile: 22,
        band: "Low",
      },
    ],
    lowest: [
      {
        code: "anxiety",
        displayName: "Anxiety",
        inventoryLabel: "NEO",
        description: "Tendency to feel tense, apprehensive, or worried in everyday situations.",
        score: 12,
        percentile: 15,
        band: "Low",
      },
      {
        code: "self-discipline",
        displayName: "Self-discipline",
        inventoryLabel: "NEO",
        description: "Ability to follow through on tasks despite distractions or boredom.",
        score: 30,
        percentile: 52,
        band: "Middle",
      },
      {
        code: "warmth",
        displayName: "Warmth",
        inventoryLabel: "NEO",
        description: "Tendency to feel affection, friendliness, and ease around other people.",
        score: 41,
        percentile: 78,
        band: "High",
      },
    ],
  },
  HEXACO: {
    highest: [
      {
        code: "honesty",
        displayName: "Honesty-Humility",
        inventoryLabel: "HEXACO",
        description: "Inclination to act sincerely, fairly, and without manipulation toward others.",
        score: 44,
        percentile: 90,
        band: "High",
      },
      {
        code: "patience",
        displayName: "Patience",
        inventoryLabel: "HEXACO",
        description: "Calm tolerance for delays, frustrations, and the perceived faults of others.",
        score: 33,
        percentile: 58,
        band: "Middle",
      },
      {
        code: "boldness",
        displayName: "Social Boldness",
        inventoryLabel: "HEXACO",
        description: "Confidence in unfamiliar social settings and willingness to take the spotlight.",
        score: 19,
        percentile: 28,
        band: "Low",
      },
    ],
    lowest: [
      {
        code: "greed",
        displayName: "Greed Avoidance",
        inventoryLabel: "HEXACO",
        description: "Disinterest in luxury, wealth, and high social status as personal motivators.",
        score: 11,
        percentile: 14,
        band: "Low",
      },
      {
        code: "diligence",
        displayName: "Diligence",
        inventoryLabel: "HEXACO",
        description: "Drive to work hard and pursue goals with persistence and effort.",
        score: 28,
        percentile: 48,
        band: "Middle",
      },
      {
        code: "creativity",
        displayName: "Creativity",
        inventoryLabel: "HEXACO",
        description: "Preference for innovative, original, and unconventional ways of thinking.",
        score: 42,
        percentile: 82,
        band: "High",
      },
    ],
  },
  MPQ: {
    highest: [
      {
        code: "wellbeing",
        displayName: "Well-being",
        inventoryLabel: "MPQ",
        description: "Tendency to feel cheerful, optimistic, and confident about life overall.",
        score: 46,
        percentile: 94,
        band: "High",
      },
      {
        code: "control",
        displayName: "Control",
        inventoryLabel: "MPQ",
        description: "Preference for planning, reflection, and a careful approach to decisions.",
        score: 32,
        percentile: 55,
        band: "Middle",
      },
      {
        code: "aggression",
        displayName: "Aggression",
        inventoryLabel: "MPQ",
        description: "Willingness to confront, retaliate, or use force when challenged.",
        score: 17,
        percentile: 24,
        band: "Low",
      },
    ],
    lowest: [
      {
        code: "stress-reaction",
        displayName: "Stress Reaction",
        inventoryLabel: "MPQ",
        description: "Tendency to feel nervous, vulnerable, and easily upset by everyday demands.",
        score: 13,
        percentile: 17,
        band: "Low",
      },
      {
        code: "achievement",
        displayName: "Achievement",
        inventoryLabel: "MPQ",
        description: "Enjoyment of demanding work, competition, and the pursuit of mastery.",
        score: 29,
        percentile: 51,
        band: "Middle",
      },
      {
        code: "social-closeness",
        displayName: "Social Closeness",
        inventoryLabel: "MPQ",
        description: "Preference for warm, affectionate ties and turning to others for support.",
        score: 43,
        percentile: 85,
        band: "High",
      },
    ],
  },
};

const FRAMEWORK_IDS: readonly FrameworkId[] = ["NEO", "HEXACO", "MPQ"];

function HoverPopover({
  item,
  rect,
}: {
  item: RankingSample;
  rect: DOMRect;
}) {
  if (typeof document === "undefined") {
    return null;
  }

  const popoverWidth = 320;
  const margin = 16;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const preferredLeft = rect.right + 18;
  const left =
    preferredLeft + popoverWidth + margin <= viewportWidth
      ? preferredLeft
      : Math.max(margin, rect.left - popoverWidth - 18);
  const top = Math.min(
    Math.max(margin, rect.top + rect.height / 2 - 110),
    viewportHeight - 220,
  );

  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 w-[20rem]"
      style={{ left, top }}
    >
      <div className="rounded-3xl border border-(--line-strong) bg-(--surface-panel-strong) p-5 shadow-(--shadow-strong)">
        <p className="clay-label">{item.inventoryLabel}</p>
        <h3 className="mt-2 font-display text-2xl leading-tight text-(--ink)">
          {item.displayName}
        </h3>
        <p className="mt-3 text-sm leading-6 text-(--ink-soft)">{item.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-(--ink-soft)">
          <p>
            Your score:{" "}
            <span className="font-semibold text-(--ink)">{item.score}/50</span>
          </p>
          <p>
            <span className="font-semibold text-(--ink)">
              Higher than {item.percentile}% of people
            </span>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function SurveyResultsPreview() {
  const [rankingMode, setRankingMode] = useState<RankingMode>("highest");
  const [activeFramework, setActiveFramework] = useState<FrameworkId>("NEO");
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const rows = rankingsByFramework[activeFramework][rankingMode];
  const hoveredRow = rows.find((row) => row.code === hoveredCode) ?? null;
  const dismissPopover = useRef(() => {
    setHoveredCode(null);
    setHoveredRect(null);
  });

  useEffect(() => {
    const dismiss = dismissPopover.current;
    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss);
      window.removeEventListener("resize", dismiss);
    };
  }, []);

  function handleHover(row: RankingSample | null, target?: HTMLElement | null) {
    setHoveredCode(row?.code ?? null);
    setHoveredRect(row && target ? target.getBoundingClientRect() : null);
  }

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
          <span className="truncate">platform.ciaobang.com/surveys/personality/dashboard</span>
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            aria-label="New tab"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--muted) transition hover:bg-(--surface-inset) hover:text-(--ink)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M6.84814 13.9785C7.25488 13.9785 7.59521 13.6548 7.59521 13.2563V7.73633H12.9575C13.356 7.73633 13.6963 7.396 13.6963 6.98926C13.6963 6.58252 13.356 6.25049 12.9575 6.25049H7.59521V0.722168C7.59521 0.32373 7.25488 0 6.84814 0C6.44141 0 6.10938 0.32373 6.10938 0.722168V6.25049H0.73877C0.340332 6.25049 0 6.58252 0 6.98926C0 7.396 0.340332 7.73633 0.73877 7.73633H6.10938V13.2563C6.10938 13.6548 6.44141 13.9785 6.84814 13.9785Z" fill="currentColor"/>
            </svg>
          </button>
          <button
            type="button"
            aria-label="Show all tabs"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--muted) transition hover:bg-(--surface-inset) hover:text-(--ink)"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M2.60645 13.5469H4.02588V14.8169C4.02588 16.5269 4.88916 17.3901 6.63232 17.3901H14.9663C16.6929 17.3901 17.5645 16.5269 17.5645 14.8169V6.4165C17.5645 4.70654 16.6929 3.84326 14.9663 3.84326H13.5386V2.57324C13.5386 0.863281 12.667 0 10.9404 0H2.60645C0.863281 0 0 0.863281 0 2.57324V10.9736C0 12.6836 0.863281 13.5469 2.60645 13.5469ZM2.62305 12.2104C1.79297 12.2104 1.33643 11.7622 1.33643 10.8989V2.64795C1.33643 1.78467 1.79297 1.33643 2.62305 1.33643H10.9155C11.7373 1.33643 12.2021 1.78467 12.2021 2.64795V3.84326H6.63232C4.88916 3.84326 4.02588 4.69824 4.02588 6.4165V12.2104H2.62305ZM6.64893 16.0537C5.82715 16.0537 5.3623 15.6055 5.3623 14.7422V6.49121C5.3623 5.62793 5.82715 5.17969 6.64893 5.17969H14.9414C15.7632 5.17969 16.228 5.62793 16.228 6.49121V14.7422C16.228 15.6055 15.7632 16.0537 14.9414 16.0537H6.64893Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="bg-(--surface-panel) p-3 sm:p-4">
        {/* Scores header + gauges */}
        <section className="rounded-3xl border border-(--line) bg-(--surface-panel-strong) px-5 py-5 shadow-(--shadow-soft) sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="clay-label">Personality dashboard</p>
              <h2 className="mt-2 font-display text-3xl text-(--ink)">Your scores</h2>
            </div>
            <div className="inline-flex rounded-full border border-(--line) bg-(--surface-panel) p-1 shadow-(--shadow-soft)">
              {(["highest", "lowest"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRankingMode(mode)}
                  aria-pressed={rankingMode === mode}
                  className={[
                    "rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition",
                    rankingMode === mode
                      ? "bg-(--accent-coral) text-(--selected-contrast) shadow-(--shadow-soft)"
                      : "text-(--ink-soft) hover:text-(--ink)",
                  ].join(" ")}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {overviewSamples.map((metric) => (
              <DashboardGauge
                key={metric.id}
                score={metric.score}
                band={metric.band}
                label={metric.label}
                median={metric.median}
                iqrStart={metric.iqrStart}
                iqrEnd={metric.iqrEnd}
              />
            ))}
          </div>
        </section>

        {/* Ranking list */}
        <section className="mt-4 rounded-3xl border border-(--line) bg-(--surface-panel-strong) px-5 py-5 shadow-(--shadow-soft) sm:px-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_5rem] items-center gap-4 border-b border-(--line) pb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-(--muted)">
            <p>{rankingMode === "highest" ? "Top traits" : "Lowest traits"}</p>
            <div className="inline-flex rounded-full border border-(--line) bg-(--surface-panel) p-0.5 shadow-(--shadow-soft)">
              {FRAMEWORK_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveFramework(id);
                    setHoveredCode(null);
                    setHoveredRect(null);
                  }}
                  className={[
                    "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition",
                    activeFramework === id
                      ? "bg-(--accent-coral) text-(--selected-contrast) shadow-(--shadow-soft)"
                      : "text-(--ink-soft) hover:text-(--ink)",
                  ].join(" ")}
                >
                  {id}
                </button>
              ))}
            </div>
            <p className="text-right">Score</p>
          </div>

          <div className="mt-3 space-y-2">
            {rows.map((row) => {
              const isHovered = hoveredCode === row.code;
              return (
                <button
                  key={row.code}
                  type="button"
                  onMouseEnter={(event) => handleHover(row, event.currentTarget)}
                  onMouseLeave={() => handleHover(null)}
                  onFocus={(event) => handleHover(row, event.currentTarget)}
                  onBlur={() => handleHover(null)}
                  className={[
                    "grid w-full grid-cols-[minmax(0,1fr)_4rem] items-center gap-4 rounded-2xl p-3 text-left transition",
                    isHovered
                      ? "bg-(--surface-panel) shadow-(--shadow-soft)"
                      : "hover:bg-(--surface-panel)",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-lg leading-tight text-(--ink)">{row.displayName}</p>
                    <div className="mt-2">
                      <SegmentedScoreBar
                        value={row.score}
                        maxValue={50}
                        band={row.band}
                        className="h-9 rounded-[0.65rem]"
                      />
                    </div>
                  </div>
                  <p className="text-right text-lg font-semibold text-(--ink)">
                    {row.score}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {hoveredRow && hoveredRect ? (
        <HoverPopover item={hoveredRow} rect={hoveredRect} />
      ) : null}
    </div>
  );
}
