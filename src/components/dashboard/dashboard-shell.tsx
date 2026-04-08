"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";

import { SiteTopNav } from "@/components/site-top-nav";
import {
  type ResultsPayload,
  type RankedScaleResult,
  type ScaleResult,
  type SurveyResults,
} from "@/lib/survey/results/types";
import { type SurveySubmissionSummary } from "@/lib/survey/types";

type RankingMode = "highest" | "lowest";

type DashboardScaleLike = Pick<
  ScaleResult,
  "code" | "displayName" | "description" | "score" | "percentileText" | "band"
>;

const DEFAULT_VISIBLE_ROWS = 10;
const SURVEY_ANSWERS_STORAGE_KEY = "ambi-survey-answers";
const PENDING_RESULTS_STORAGE_KEY = "ambi-pending-results";

function scoreBandColor(band: RankedScaleResult["band"]) {
  if (band === "High") {
    return "var(--accent-blue)";
  }

  if (band === "Low") {
    return "var(--accent-coral)";
  }

  return "var(--accent-sand)";
}

function scoreBandAccent(band: RankedScaleResult["band"]) {
  if (band === "High") {
    return "rgba(127, 169, 209, 0.75)";
  }

  if (band === "Low") {
    return "rgba(230, 121, 109, 0.78)";
  }

  return "rgba(227, 218, 204, 0.92)";
}

function percentileSentence(item: { percentileDirection: "higher" | "lower"; percentileMagnitude: number }) {
  return item.percentileDirection === "higher"
    ? `You scored higher than ${item.percentileMagnitude} percent of people.`
    : `You scored lower than ${item.percentileMagnitude} percent of people.`;
}

function formatSubmittedAt(timestamp: string | null) {
  if (!timestamp) {
    return "not yet submitted";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function describeDashboardError(error: string) {
  if (/authentication required/i.test(error)) {
    return "Please refresh the page and try again.";
  }

  return error;
}

function SummaryNarrative({ results }: { results: SurveyResults }) {
  const strongestScore = results.narrative.strongestScore;
  const strongestPercentile = results.narrative.strongestPercentile;
  const lowestScore = results.narrative.lowestScore;
  const lowestPercentile = results.narrative.lowestPercentile;
  const strongestOthers = results.narrative.strongestOthers.map((item) => item.displayName).join(", ");
  const lowestOthers = results.narrative.lowestOthers.map((item) => item.displayName).join(", ");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <p className="text-base leading-8 text-[var(--ink-soft)]">
        {strongestScore ? (
          <>
            The highest score you received was on{" "}
            <span className="font-semibold text-[var(--ink)]">{strongestScore.displayName}</span>,
            indicating you likely exhibit {strongestScore.description.toLowerCase()}.{" "}
          </>
        ) : null}
        {strongestPercentile ? (
          <>
            Your score for{" "}
            <span className="font-semibold text-[var(--ink)]">{strongestPercentile.displayName}</span>{" "}
            was higher than {strongestPercentile.percentileMagnitude}% of respondents, indicating{" "}
            {strongestPercentile.description.toLowerCase()}.
          </>
        ) : null}
        {strongestOthers ? (
          <> You also scored highly on {strongestOthers}.</>
        ) : null}
      </p>

      <p className="text-base leading-8 text-[var(--ink-soft)]">
        {lowestScore ? (
          <>
            The lowest score you received was on{" "}
            <span className="font-semibold text-[var(--ink)]">{lowestScore.displayName}</span>,
            suggesting you do not exhibit {lowestScore.description.toLowerCase()}.{" "}
          </>
        ) : null}
        {lowestPercentile ? (
          <>
            Your score for{" "}
            <span className="font-semibold text-[var(--ink)]">{lowestPercentile.displayName}</span>{" "}
            was lower than {lowestPercentile.percentileMagnitude}% of respondents, indicating{" "}
            {lowestPercentile.description.toLowerCase()}.
          </>
        ) : null}
        {lowestOthers ? (
          <> You also scored low on {lowestOthers}.</>
        ) : null}
      </p>
    </div>
  );
}

function HoverDetailCard({ item }: { item: RankedScaleResult }) {
  return (
    <div className="rounded-[1.8rem] border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] p-5 shadow-[var(--shadow-strong)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
        {item.inventoryLabel}
      </p>
      <h3 className="mt-2 font-display text-3xl text-[var(--ink)]">{item.displayName}</h3>
      <p className="mt-3 max-w-2xl text-base leading-8 text-[var(--ink-soft)]">{item.description}</p>
      <div className="mt-5 flex flex-wrap gap-6 text-sm text-[var(--ink-soft)]">
        <p>
          Your score: <span className="font-semibold text-[var(--ink)]">{item.score}/50</span>
        </p>
        <p>
          <span className="font-semibold text-[var(--ink)]">{item.percentileText}</span>
        </p>
      </div>
    </div>
  );
}

function HoverPopover({
  item,
  rect,
}: {
  item: RankedScaleResult;
  rect: DOMRect;
}) {
  if (typeof document === "undefined") {
    return null;
  }

  const popoverWidth = 340;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const left = rect.right + 18 + popoverWidth <= viewportWidth
    ? rect.right + 18
    : Math.max(16, rect.left - popoverWidth - 18);
  const top = clamp(rect.top + rect.height / 2 - 110, 16, viewportHeight - 220);

  return createPortal(
    <div
      className="pointer-events-none fixed z-50 w-[21.25rem]"
      style={{
        left,
        top,
      }}
    >
      <HoverDetailCard item={item} />
    </div>,
    document.body,
  );
}

function RankingBar({
  value,
  maxValue,
  color,
}: {
  value: number;
  maxValue: number;
  color: string;
}) {
  const width = clamp((value / maxValue) * 100, 6, 100);

  return (
    <div className="relative h-12 overflow-hidden rounded-[1rem] bg-[var(--surface-inset)]">
      <div
        className="absolute inset-y-0 left-0 rounded-[1rem]"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, color-mix(in srgb, ${color} 18%, transparent), color-mix(in srgb, ${color} 62%, rgba(255,255,255,0.08)))`,
        }}
      />
      <div
        className="absolute inset-0 opacity-85"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent calc(20% - 1px), var(--line) calc(20% - 1px), var(--line) 20%, transparent 20%, transparent calc(40% - 1px), var(--line) calc(40% - 1px), var(--line) 40%, transparent 40%, transparent calc(60% - 1px), var(--line) calc(60% - 1px), var(--line) 60%, transparent 60%, transparent calc(80% - 1px), var(--line) calc(80% - 1px), var(--line) 80%, transparent 80%)",
        }}
      />
    </div>
  );
}

function RankingColumn({
  label,
  valueLabel,
  items,
  metric,
  hoveredCode,
  onHover,
}: {
  label: string;
  valueLabel: string;
  items: RankedScaleResult[];
  metric: "score" | "percentile";
  hoveredCode: string | null;
  onHover: (item: RankedScaleResult | null, target?: HTMLElement | null) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-4 border-b border-[var(--line)] pb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        <p>{label}</p>
        <p className="text-right">{valueLabel}</p>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const highlight = hoveredCode === item.code;
          const value = metric === "score" ? item.score : item.percentileMagnitude;

          return (
            <button
              key={`${metric}-${item.code}`}
              type="button"
              onMouseEnter={(event) => onHover(item, event.currentTarget)}
              onMouseLeave={() => onHover(null)}
              onFocus={(event) => onHover(item, event.currentTarget)}
              onBlur={() => onHover(null)}
              className={[
                "grid w-full grid-cols-[minmax(0,1fr)_4rem] items-center gap-4 rounded-[1.1rem] p-2 text-left transition",
                highlight
                  ? "bg-[var(--surface-panel-strong)] shadow-[var(--shadow-soft)]"
                  : "hover:bg-[var(--surface-panel)]",
              ].join(" ")}
            >
              <div className="min-w-0">
                <p className="line-clamp-1 text-[1.35rem] leading-tight text-[var(--ink)]">{item.displayName}</p>
                <div className="mt-2">
                  <RankingBar
                    value={value}
                    maxValue={metric === "score" ? 50 : 100}
                    color={scoreBandColor(item.band)}
                  />
                </div>
              </div>
              <p className="text-right text-xl font-semibold text-[var(--ink)]">{value}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Gauge({
  score,
  band,
  label,
  median,
  iqrStart,
  iqrEnd,
}: {
  score: number;
  band: string;
  label: string;
  median?: number;
  iqrStart?: number;
  iqrEnd?: number;
}) {
  const radius = 82;
  const circumference = Math.PI * radius;
  const progress = score / 50;
  const dashOffset = circumference * (1 - progress);
  const centerX = 100;
  const centerY = 94;
  const path = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;
  const startValue = clamp((iqrStart ?? median ?? 25) - 1.5, 0, 50);
  const endValue = clamp((iqrEnd ?? median ?? 35) + 1.5, 0, 50);
  const medianValue = clamp(median ?? Math.round((startValue + endValue) / 2), 0, 50);
  const iqrStartAngle = Math.PI * (1 - startValue / 50);
  const iqrEndAngle = Math.PI * (1 - endValue / 50);
  const medianAngle = Math.PI * (1 - medianValue / 50);
  const iqrRadius = radius + 22;
  const iqrPath = `M ${centerX + Math.cos(iqrStartAngle) * iqrRadius} ${centerY - Math.sin(iqrStartAngle) * iqrRadius} A ${iqrRadius} ${iqrRadius} 0 0 1 ${centerX + Math.cos(iqrEndAngle) * iqrRadius} ${centerY - Math.sin(iqrEndAngle) * iqrRadius}`;
  const medianX = centerX + Math.cos(medianAngle) * iqrRadius;
  const medianY = centerY - Math.sin(medianAngle) * iqrRadius;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 200 118" className="h-[9.5rem] w-full max-w-[12.75rem] overflow-visible">
        <path
          d={path}
          fill="none"
          stroke="var(--line)"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d={path}
          fill="none"
          stroke={scoreBandAccent(band as RankedScaleResult["band"])}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        {[0, 10, 20, 30, 40, 50].map((tick) => {
          const angle = Math.PI * (1 - tick / 50);
          const outerX = centerX + Math.cos(angle) * (radius + 4);
          const outerY = centerY - Math.sin(angle) * (radius + 4);
          const innerX = centerX + Math.cos(angle) * (radius - 6);
          const innerY = centerY - Math.sin(angle) * (radius - 6);
          const labelX = centerX + Math.cos(angle) * (radius - 28);
          const labelY = centerY - Math.sin(angle) * (radius - 28) + 6;

          return (
            <g key={tick}>
              <line
                x1={innerX}
                y1={innerY}
                x2={outerX}
                y2={outerY}
                stroke="var(--line-strong)"
                strokeWidth="1.5"
              />
              <text
                x={labelX}
                y={labelY}
                fill="var(--muted)"
                fontSize="9"
                textAnchor="middle"
              >
                {tick}
              </text>
            </g>
          );
        })}
        <path
          d={iqrPath}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="2.5"
          opacity="0.75"
        />
        <circle cx={medianX} cy={medianY} r="4" fill="var(--muted)" />
      </svg>
      <div className="-mt-14 text-center">
        <p className="text-[2.75rem] leading-none text-[var(--ink)]">{score}</p>
        <p className="mt-1 text-lg text-[var(--ink-soft)]">{band}</p>
      </div>
      <p className="max-w-[12.75rem] text-center text-[1.35rem] leading-tight text-[var(--ink)]">
        {label}
      </p>
      {median !== undefined ? (
        <p className="text-sm text-[var(--muted)]">Majority of people (IQR)</p>
      ) : null}
    </div>
  );
}

function DetailBars({ items }: { items: DashboardScaleLike[] }) {
  return (
    <div className="divide-y divide-[var(--line)] rounded-[2rem] border border-[var(--line)] bg-[var(--surface-panel)]">
      {items.map((item) => (
        <div key={item.code} className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center">
          <div>
            <h4 className="text-[1.65rem] leading-tight text-[var(--ink)]">{item.displayName}</h4>
            <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[var(--ink-soft)]">
              {item.description}
            </p>
          </div>
          <div>
            <p className="text-right text-xl font-semibold text-[var(--ink)]">{item.score}/50</p>
            <div className="mt-3">
              <RankingBar value={item.score} maxValue={50} color={scoreBandColor(item.band)} />
            </div>
            <p className="mt-3 text-right text-[1.1rem] text-[var(--ink-soft)]">{item.percentileText}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FrameworkPanel({ framework }: { framework: SurveyResults["frameworks"][number] }) {
  return (
    <section className="rounded-[2.2rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Score estimates comparable to
        </p>
        <h2 className="mt-3 font-display text-3xl text-[var(--ink)] sm:text-4xl">
          {framework.heading}
        </h2>
        <p className="mt-3 text-base leading-7 text-[var(--ink-soft)]">{framework.methodology}</p>
      </div>

      {framework.overview.length > 0 ? (
        <div className="mx-auto mt-8 grid max-w-6xl gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {framework.overview.map((metric) => (
            <Gauge
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
      ) : null}

      <div className="mx-auto mt-10 max-w-6xl">
        <p className="text-base leading-8 text-[var(--ink-soft)]">{framework.intro}</p>
        <a
          href={framework.readMoreHref}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex text-base underline decoration-[var(--line-strong)] underline-offset-4 transition hover:text-[var(--accent-coral)]"
        >
          Read more
        </a>
      </div>

      <div className="mx-auto mt-7 max-w-6xl space-y-5">
        {framework.layout === "gauges"
          ? framework.sections.map((section) => {
              const metric = framework.overview.find((item) => item.label === section.title);

              return (
                <article
                  key={section.id}
                  className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--surface-panel-strong)] p-4 shadow-[var(--shadow-soft)] sm:p-5"
                >
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
                    <div>
                      <h3 className="font-display text-3xl text-[var(--ink)]">{section.title}</h3>
                      {section.description ? (
                        <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--ink-soft)]">
                          {section.description}
                        </p>
                      ) : null}
                      {metric ? (
                        <p className="mt-4 text-xl font-semibold text-[var(--ink)]">
                          {percentileSentence(metric)}
                        </p>
                      ) : null}
                    </div>
                    {metric ? (
                      <Gauge
                        score={metric.score}
                        band={metric.band}
                        label={metric.label}
                        median={metric.median}
                        iqrStart={metric.iqrStart}
                        iqrEnd={metric.iqrEnd}
                      />
                    ) : null}
                  </div>
                  <div className="mt-8">
                    <DetailBars items={section.items} />
                  </div>
                </article>
              );
            })
          : framework.sections.map((section) => (
              <article key={section.id}>
                <DetailBars items={section.items} />
              </article>
            ))}
      </div>
    </section>
  );
}

function EmptyDashboard() {
  return (
    <section
      className="mt-4 rounded-[2.6rem] border border-[var(--line)] px-8 py-10 shadow-[var(--shadow-strong)] sm:px-12"
      style={{ background: "var(--hero-gradient)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
        No submission yet
      </p>
      <h1 className="mt-4 font-display text-5xl text-[var(--ink)] sm:text-6xl">
        Your results dashboard appears after you submit the survey.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--ink-soft)]">
        Finish the questionnaire to generate AMBI-based score estimates, ranked traits, and the
        eight-framework breakdown on this page.
      </p>
      <Link
        href="/personalitysurvey"
        className="mt-8 inline-flex rounded-full bg-[var(--accent-coral)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--selected-contrast)] transition hover:brightness-105"
      >
        Start survey
      </Link>
    </section>
  );
}

function SubmissionHistoryList({
  submissions,
  selectedSubmissionId,
  isSwitchingSubmission,
  selectionError,
  onSelect,
}: {
  submissions: SurveySubmissionSummary[];
  selectedSubmissionId: string | null;
  isSwitchingSubmission: boolean;
  selectionError: string | null;
  onSelect: (submissionId: string) => void;
}) {
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Completed surveys
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            Open any saved submission stored for this account.
          </p>
        </div>
        <p className="rounded-full bg-[var(--surface-panel-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink)]">
          {submissions.length} saved
        </p>
      </div>

      {selectionError ? (
        <p className="mt-4 text-sm leading-6 text-[var(--accent-coral)]">
          {describeDashboardError(selectionError)}
        </p>
      ) : null}

      <div className="mt-4 max-h-[18rem] space-y-3 overflow-y-auto pr-1">
        {submissions.map((submission, index) => {
          const isActive = selectedSubmissionId === submission.submissionId;

          return (
            <button
              key={submission.submissionId}
              type="button"
              onClick={() => onSelect(submission.submissionId)}
              disabled={isSwitchingSubmission && !isActive}
              className={[
                "w-full rounded-[1.4rem] border px-4 py-4 text-left transition",
                isActive
                  ? "border-[var(--line-strong)] bg-[var(--surface-panel-strong)] shadow-[var(--shadow-soft)]"
                  : "border-[var(--line)] bg-[var(--surface-panel)] hover:border-[var(--line-strong)]",
                isSwitchingSubmission && !isActive ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {index === 0 ? "Most recent" : "Saved submission"}
                  </p>
                  <p className="mt-2 text-base font-semibold text-[var(--ink)]">
                    {formatSubmittedAt(submission.submittedAt)}
                  </p>
                </div>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                    isActive
                      ? "bg-[var(--accent-coral)] text-[var(--selected-contrast)]"
                      : "bg-[var(--surface-panel-strong)] text-[var(--ink-soft)]",
                  ].join(" ")}
                >
                  {isSwitchingSubmission && isActive ? "Loading..." : isActive ? "Viewing" : "Open"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                {submission.answerCount} scored responses attached to this completion.
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LoadingDashboard() {
  return (
    <section
      className="mt-4 rounded-[2.6rem] border border-[var(--line)] px-8 py-10 shadow-[var(--shadow-strong)] sm:px-12"
      style={{ background: "var(--hero-gradient)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
        Loading results
      </p>
      <h1 className="mt-4 font-display text-5xl text-[var(--ink)] sm:text-6xl">
        Preparing your dashboard.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--ink-soft)]">
        We are loading your saved submissions and translating the selected answers into AMBI-based
        score estimates.
      </p>
    </section>
  );
}

export function DashboardShell() {
  const { getToken } = useAuth({ treatPendingAsSignedOut: false });
  const getTokenRef = useRef(getToken);
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [submissions, setSubmissions] = useState<SurveySubmissionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitchingSubmission, setIsSwitchingSubmission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [rankingMode, setRankingMode] = useState<RankingMode>("highest");
  const [showAllRankings, setShowAllRankings] = useState(false);
  const [hoveredScale, setHoveredScale] = useState<RankedScaleResult | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const [activeFrameworkId, setActiveFrameworkId] = useState("NEO");

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    function handleViewportChange() {
      setHoveredScale(null);
      setHoveredRect(null);
    }

    window.addEventListener("scroll", handleViewportChange, { passive: true });
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.removeEventListener("scroll", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, []);

  const applyResultsPayload = useCallback((payload: ResultsPayload) => {
    if (payload.results) {
      window.sessionStorage.removeItem(PENDING_RESULTS_STORAGE_KEY);
      window.sessionStorage.removeItem(SURVEY_ANSWERS_STORAGE_KEY);
    }

    setResults(payload.results);
    setSubmissions(payload.submissions ?? []);
    setSelectedSubmissionId(payload.selectedSubmissionId ?? payload.results?.submission.submissionId ?? null);
    setActiveFrameworkId(payload.results?.frameworks[0]?.id ?? "NEO");
    setHoveredScale(null);
    setHoveredRect(null);
    setSelectionError(null);
    setError(null);
  }, []);

  const fetchResultsPayload = useCallback(async (submissionId?: string) => {
    const token = await getTokenRef.current().catch(() => null);
    const headers = new Headers();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const search = submissionId ? `?submissionId=${encodeURIComponent(submissionId)}` : "";
    const response = await fetch(`/api/survey/results${search}`, {
      cache: "no-store",
      credentials: "include",
      headers,
    });
    const payload = (await response.json()) as ResultsPayload;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load the saved survey results.");
    }

    return payload;
  }, []);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        setIsLoading(true);
        const payload = await fetchResultsPayload();

        if (isMounted) {
          applyResultsPayload(payload);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load the saved survey results.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [applyResultsPayload, fetchResultsPayload]);

  const handleSelectSubmission = useCallback(
    (submissionId: string) => {
      if (submissionId === selectedSubmissionId || isSwitchingSubmission) {
        return;
      }

      setIsSwitchingSubmission(true);
      setSelectionError(null);

      void (async () => {
        try {
          const payload = await fetchResultsPayload(submissionId);
          applyResultsPayload(payload);
        } catch (fetchError) {
          setSelectionError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load the selected survey results.",
          );
        } finally {
          setIsSwitchingSubmission(false);
        }
      })();
    },
    [applyResultsPayload, fetchResultsPayload, isSwitchingSubmission, selectedSubmissionId],
  );

  const activeFramework = results?.frameworks.find((framework) => framework.id === activeFrameworkId)
    ?? results?.frameworks[0]
    ?? null;
  const leftRankings = rankingMode === "highest" ? results?.ranked.highestByScore : results?.ranked.lowestByScore;
  const rightRankings =
    rankingMode === "highest" ? results?.ranked.highestByPercentile : results?.ranked.lowestByPercentile;
  const visibleCount = showAllRankings ? undefined : DEFAULT_VISIBLE_ROWS;
  const visibleLeftRankings = leftRankings?.slice(0, visibleCount);
  const visibleRightRankings = rightRankings?.slice(0, visibleCount);
  const handleHover = (item: RankedScaleResult | null, target?: HTMLElement | null) => {
    setHoveredScale(item);
    setHoveredRect(item && target ? target.getBoundingClientRect() : null);
  };

  return (
    <>
      <SiteTopNav
        breadcrumbItems={[
          { label: "Measures of Your Personality", href: "/personalitysurvey" },
          { label: "Survey Results" },
        ]}
        action={
          <Link
            href="/personalitysurvey"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--accent-coral)] px-5 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--selected-contrast)] transition hover:brightness-105"
          >
            {results ? "Review survey" : "Start survey"}
          </Link>
        }
      />

      {isLoading ? <LoadingDashboard /> : null}

      {!isLoading && error ? (
        <section
          className="mt-4 rounded-[2.6rem] border border-[var(--line)] px-8 py-10 shadow-[var(--shadow-strong)] sm:px-12"
          style={{ background: "var(--hero-gradient)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
            Results unavailable
          </p>
          <h1 className="mt-4 font-display text-5xl text-[var(--ink)] sm:text-6xl">
            We could not load the dashboard right now.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--accent-coral)]">
            {describeDashboardError(error)}
          </p>
        </section>
      ) : null}

      {!isLoading && !error && !results ? <EmptyDashboard /> : null}

      {!isLoading && !error && results ? (
        <div className="mt-4 space-y-6">
          <section
            className="overflow-hidden rounded-[2.4rem] border border-[var(--line)] px-5 py-6 shadow-[var(--shadow-strong)] sm:px-8 sm:py-8"
            style={{ background: "var(--hero-gradient)" }}
          >
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_22rem] xl:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Survey Results
                </p>
                <h1 className="mt-4 font-display text-4xl text-[var(--ink)] sm:text-5xl">
                  200+ Measures of Your Personality
                </h1>
                <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--ink-soft)]">
                  The questions you answered are used to generate personality scores across several
                  different frameworks. This approach, based on the Analog to Multiple Broadband
                  Inventories, estimates your scores using a limited number of public-domain questions.
                </p>
                <p className="mt-3 max-w-4xl text-[15px] leading-7 text-[var(--ink-soft)]">
                  Please note that the results provided below are for informational purposes only, and
                  are not intended to be psychological or medical advice. The accuracy or completeness
                  of the results are not guaranteed.
                </p>
              </div>

              <div className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Viewing saved results
                </p>
                <p className="mt-3 text-[1.65rem] text-[var(--ink)]">
                  {formatSubmittedAt(results.submission.submittedAt)}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                  {results.submission.answerCount} responses were scored from the selected submission
                  stored on this account.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={activeFramework?.readMoreHref ?? "https://doi.org/10.1016/j.jrp.2010.01.002"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--line-strong)]"
                  >
                    Read the source
                  </a>
                  <button
                    type="button"
                    className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--ink)] opacity-80"
                  >
                    Share your results
                  </button>
                </div>

                <SubmissionHistoryList
                  submissions={submissions}
                  selectedSubmissionId={selectedSubmissionId}
                  isSwitchingSubmission={isSwitchingSubmission}
                  selectionError={selectionError}
                  onSelect={handleSelectSubmission}
                />
              </div>
            </div>

            <div className="mt-8">
              <SummaryNarrative results={results} />
            </div>
          </section>

          <section className="rounded-[2.4rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-3xl text-[var(--ink)]">Your Scores</h2>
              <div className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface-panel-strong)] p-1">
                {(["highest", "lowest"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setRankingMode(mode);
                      setShowAllRankings(false);
                    }}
                    className={[
                      "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition",
                      rankingMode === mode
                        ? "bg-[var(--accent-coral)] text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)]",
                    ].join(" ")}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
              <RankingColumn
                label="Overall score"
                valueLabel="Out of 50"
                items={visibleLeftRankings ?? []}
                metric="score"
                hoveredCode={hoveredScale?.code ?? null}
                onHover={handleHover}
              />
              <RankingColumn
                label="Compared to others"
                valueLabel={rankingMode === "highest" ? "Higher than % of people" : "Lower than % of people"}
                items={visibleRightRankings ?? []}
                metric="percentile"
                hoveredCode={hoveredScale?.code ?? null}
                onHover={handleHover}
              />
            </div>

            {((leftRankings?.length ?? 0) > DEFAULT_VISIBLE_ROWS ||
              (rightRankings?.length ?? 0) > DEFAULT_VISIBLE_ROWS) && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllRankings((current) => !current)}
                  className="text-xl text-[var(--ink-soft)] underline decoration-[var(--line-strong)] underline-offset-4 transition hover:text-[var(--ink)]"
                >
                  {showAllRankings ? "Show less" : "Show more"}
                </button>
              </div>
            )}
          </section>

          <section className="rounded-[2.4rem] border border-[var(--line)] bg-[var(--surface-panel)] px-4 py-3 shadow-[var(--shadow-soft)] sm:px-5">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {results.frameworks.map((framework) => (
                <button
                  key={framework.id}
                  type="button"
                  onClick={() => setActiveFrameworkId(framework.id)}
                  className={[
                    "rounded-[1.05rem] px-4 py-2.5 text-lg font-semibold uppercase tracking-[0.08em] transition",
                    activeFrameworkId === framework.id
                      ? "bg-[var(--accent-coral)] text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]"
                      : "text-[var(--ink)] hover:bg-[var(--surface-panel-strong)]",
                  ].join(" ")}
                >
                  {framework.tabLabel}
                </button>
              ))}
            </div>
          </section>

          {activeFramework ? <FrameworkPanel framework={activeFramework} /> : null}
          {hoveredScale && hoveredRect ? <HoverPopover item={hoveredScale} rect={hoveredRect} /> : null}
        </div>
      ) : null}
    </>
  );
}

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(maxValue, Math.max(minValue, value));
}
