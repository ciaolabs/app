"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  DashboardGauge,
  SegmentedScoreBar,
} from "@/components/dashboard/dashboard-metrics";
import {
  describeDashboardError,
  SubmissionHistoryList,
  SurveyDashboardLayout,
} from "@/components/dashboard/survey-dashboard-layout";
import { sessionDraftStorage } from "@/lib/survey/draft-storage";
import { type ActiveSurveyDefinition } from "@/lib/survey/definitions";
import {
  type ResultsPayload,
  type RankedScaleResult,
  type ScaleResult,
  type SurveyResults,
} from "@/lib/survey/results/types";
import { getSurveyApiBasePath } from "@/lib/survey/routes";
import { type SurveySubmissionSummary } from "@/lib/survey/types";

type RankingMode = "highest" | "lowest";

type DashboardScaleLike = Pick<
  ScaleResult,
  "code" | "displayName" | "description" | "score" | "percentileText" | "band"
>;

const DEFAULT_VISIBLE_ROWS = 10;

function percentileSentence(item: { percentileDirection: "higher" | "lower"; percentileMagnitude: number }) {
  return item.percentileDirection === "higher"
    ? `You scored higher than ${item.percentileMagnitude} percent of people.`
    : `You scored lower than ${item.percentileMagnitude} percent of people.`;
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
    <div className="rounded-[1.5rem] border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] p-5 shadow-[var(--shadow-strong)]">
      <p className="clay-label">
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
                "grid w-full grid-cols-[minmax(0,1fr)_4rem] items-center gap-4 rounded-[1rem] p-2 text-left transition",
                highlight
                  ? "bg-[var(--surface-panel-strong)] shadow-[var(--shadow-soft)]"
                  : "hover:bg-[var(--surface-panel)]",
              ].join(" ")}
            >
              <div className="min-w-0">
                <p className="line-clamp-1 text-[1.35rem] leading-tight text-[var(--ink)]">{item.displayName}</p>
                <div className="mt-2">
                  <SegmentedScoreBar
                    value={value}
                    maxValue={metric === "score" ? 50 : 100}
                    band={item.band}
                    className="h-12 rounded-[0.75rem]"
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

function DetailBars({ items }: { items: DashboardScaleLike[] }) {
  return (
    <div className="divide-y divide-[var(--line)] rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)]">
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
              <SegmentedScoreBar
                value={item.score}
                maxValue={50}
                band={item.band}
                className="h-12 rounded-[0.75rem]"
              />
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
    <section data-pdf-capture className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7">
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
                  className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel-strong)] p-4 shadow-[var(--shadow-soft)] sm:p-5"
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
                      <DashboardGauge
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

type DashboardShellProps = {
  survey: Pick<ActiveSurveyDefinition, "type" | "title" | "route" | "resultsTitle">;
  initialPayload: ResultsPayload<SurveyResults>;
};

export function DashboardShell({ survey, initialPayload }: DashboardShellProps) {
  const [results, setResults] = useState<SurveyResults | null>(initialPayload.results ?? null);
  const [submissions, setSubmissions] = useState<SurveySubmissionSummary[]>(
    initialPayload.submissions ?? [],
  );
  const [isSwitchingSubmission, setIsSwitchingSubmission] = useState(false);
  const [error, setError] = useState<string | null>(initialPayload.error ?? null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(
    initialPayload.selectedSubmissionId ?? initialPayload.results?.submission.submissionId ?? null,
  );
  const [rankingMode, setRankingMode] = useState<RankingMode>("highest");
  const [showAllRankings, setShowAllRankings] = useState(false);
  const [hoveredScale, setHoveredScale] = useState<RankedScaleResult | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const [activeFrameworkId, setActiveFrameworkId] = useState(
    initialPayload.results?.frameworks[0]?.id ?? "NEO",
  );
  const surveyApiBasePath = getSurveyApiBasePath(survey.type);
  const hasSyncedLatestResults = useRef(false);

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

  useEffect(() => {
    if (!results) {
      return;
    }

    if (sessionDraftStorage.hasPendingResults(survey.type)) {
      return;
    }

    sessionDraftStorage.clearAnswers(survey.type);
  }, [results, survey.type]);

  const applyResultsPayload = useCallback((payload: ResultsPayload<SurveyResults>) => {
    sessionDraftStorage.clearPendingResults(survey.type);

    if (payload.results) {
      sessionDraftStorage.clearAnswers(survey.type);
    }

    setResults(payload.results);
    setSubmissions(payload.submissions ?? []);
    setSelectedSubmissionId(payload.selectedSubmissionId ?? payload.results?.submission.submissionId ?? null);
    setActiveFrameworkId(payload.results?.frameworks[0]?.id ?? "NEO");
    setHoveredScale(null);
    setHoveredRect(null);
    setSelectionError(null);
    setError(null);
  }, [survey.type]);

  const fetchResultsPayload = useCallback(async (submissionId?: string) => {
    const search = submissionId ? `?submissionId=${encodeURIComponent(submissionId)}` : "";
    const response = await fetch(`${surveyApiBasePath}/results${search}`, {
      cache: "no-store",
      credentials: "include",
    });
    const payload = (await response.json()) as ResultsPayload<SurveyResults>;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load the saved survey results.");
    }

    return payload;
  }, [surveyApiBasePath]);

  useEffect(() => {
    if (error || hasSyncedLatestResults.current) {
      return;
    }

    const hasPendingSubmission = sessionDraftStorage.hasPendingResults(survey.type);

    if (results && !hasPendingSubmission) {
      return;
    }

    hasSyncedLatestResults.current = true;
    let isMounted = true;

    void (async () => {
      try {
        const payload = await fetchResultsPayload();

        if (isMounted) {
          applyResultsPayload(payload);
        }
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load the saved survey results.",
        );
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [applyResultsPayload, error, fetchResultsPayload, results, survey.type]);

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
    <SurveyDashboardLayout
      survey={survey}
      error={error}
      hasResults={Boolean(results)}
      submission={results?.submission ?? null}
      emptyStateBody="Finish the questionnaire to generate AMBI-based score estimates, ranked traits, and the eight-framework breakdown on this page."
      heroDescription={
        <>
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
        </>
      }
      heroActionLinks={
        <a
          href={activeFramework?.readMoreHref ?? "https://doi.org/10.1016/j.jrp.2010.01.002"}
          target="_blank"
          rel="noreferrer"
          className="clay-button-hover inline-flex rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-soft)]"
        >
          Read the source
        </a>
      }
      submissionHistory={
        <SubmissionHistoryList
          submissions={submissions}
          selectedSubmissionId={selectedSubmissionId}
          isSwitchingSubmission={isSwitchingSubmission}
          selectionError={selectionError}
          onSelect={handleSelectSubmission}
        />
      }
      heroFooter={results ? <SummaryNarrative results={results} /> : null}
    >
      {results ? (
        <>
          <section data-pdf-capture className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-3xl text-[var(--ink)]">Your Scores</h2>
              <div data-print-hide className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface-panel-strong)] p-1 shadow-[var(--shadow-soft)]">
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
              <div data-print-hide className="mt-8 flex justify-center">
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

          <section data-print-hide className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-4 py-3 shadow-[var(--shadow-soft)] sm:px-5">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {results.frameworks.map((framework) => (
                <button
                  key={framework.id}
                  type="button"
                  onClick={() => setActiveFrameworkId(framework.id)}
                  className={[
                    "rounded-full px-4 py-2.5 text-lg font-semibold uppercase tracking-[0.08em] transition",
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

          <section data-print-hide className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              More information about the science behind this survey can be found here:
            </p>
            <div className="mt-5 space-y-5 text-[15px] leading-7 text-[var(--ink-soft)]">
              <p>
                Yarkoni, T. (2010). The abbreviation of personality, or how to measure 200 personality scales with 200 items. <em>Journal of research in personality</em>, 44(2), 180-198.{" "}
                <a
                  href="https://doi.org/10.1016/j.jrp.2010.01.002"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-[var(--line-strong)] underline-offset-4 transition hover:text-[var(--accent-coral)]"
                >
                  https://doi.org/10.1016/j.jrp.2010.01.002
                </a>
              </p>
            </div>
          </section>

          {hoveredScale && hoveredRect ? <HoverPopover item={hoveredScale} rect={hoveredRect} /> : null}
        </>
      ) : null}
    </SurveyDashboardLayout>
  );
}

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(maxValue, Math.max(minValue, value));
}
