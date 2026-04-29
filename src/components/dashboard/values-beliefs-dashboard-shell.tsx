"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { BeliefsLevelSummaryViolin } from "@/components/dashboard/beliefs-level-summary-violin";
import { DashboardGaugeCard } from "@/components/dashboard/dashboard-gauge-card";
import { DashboardPdfButton } from "@/components/dashboard/dashboard-pdf-button";
import { DashboardPrintHeader } from "@/components/dashboard/dashboard-print-header";
import { SegmentedScoreRow } from "@/components/dashboard/segmented-score-row";
import { SiteTopNav } from "@/components/site-top-nav";
import { formatSubmittedAt } from "@/lib/date-format";
import {
  getPendingResultsKey,
  getStoredAnswersKey,
  type ActiveSurveyDefinition,
} from "@/lib/survey/definitions";
import {
  type BeliefsResultTab,
  type PolarScaleResult,
  type ResultsPayload,
  type ValuesBeliefsResults,
  type ValuesScaleResult,
} from "@/lib/survey/results/types";
import { SURVEYS_ROUTE, getSurveyApiBasePath } from "@/lib/survey/routes";
import { type SurveySubmissionSummary } from "@/lib/survey/types";

type DashboardTab = "beliefs" | "values";

const BELIEF_LEVEL_THREE_ORDER = [
  "meaningful",
  "interesting",
  "cooperative",
  "changing",
  "needs-me",
  "worth-exploring",
  "harmless",
  "pleasurable",
  "progressing",
  "hierarchical",
  "abundant",
  "improvable",
  "beautiful",
  "interconnected",
  "understandable",
  "just",
  "funny",
  "stable",
  "about-me",
  "regenerative",
  "intentional",
  "acceptable",
] as const;

const BELIEF_SECTION_LOOKUP = {
  enticing: "enticing-tertiary",
  safe: "safe-tertiary",
  alive: "alive-tertiary",
} as const;

const BELIEF_CARD_COPY = {
  good: {
    title: "Belief that the World is Good vs. Bad",
    description:
      "Higher scores suggest a belief that the world is fundamentally good, beautiful, meaningful, and getting better over time.",
  },
  enticing: {
    title: "Enticing vs. Dull",
    description:
      "This dimension reflects how worthwhile, beautiful, meaningful, and interesting the world feels overall.",
  },
  safe: {
    title: "Safe vs. Dangerous",
    description:
      "This dimension captures beliefs about the world being fair, stable, comfortable, and more safe than dangerous.",
  },
  alive: {
    title: "Alive vs. Mechanistic",
    description:
      "This dimension captures beliefs about the extent to which life is shaped by purpose, participation, and responsiveness.",
  },
} as const;

const BELIEFS_REFERENCES = [
  {
    citation:
      "Clifton, J. D. W., Baker, J. D., Park, C. L., Yaden, D. B., Clifton, A. B. W., Terni, P., Miller, J. L., Zeng, G., Giorgi, S., Schwartz, H. A., & Seligman, M. E. P. (2019). Primal world beliefs. Psychological Assessment, 31(1), 82-99.",
    href: "https://doi.org/10.1037/pas0000639",
  },
  {
    citation:
      "Clifton, J. D., & Kim, E. S. (2020). Healthy in a crummy world: Implications of primal world beliefs for health psychology. Medical Hypotheses, 135, 109463.",
    href: "https://doi.org/10.1016/j.mehy.2019.109463",
  },
] as const;

const VALUES_REFERENCES = [
  {
    citation:
      "Schwartz, S. H., & Cieciuch, J. (2022). Measuring the Refined Theory of Individual Values in 49 Cultural Groups: Psychometrics of the Revised Portrait Value Questionnaire. Assessment, 29(5), 1005-1019.",
    href: "https://doi.org/10.1177/1073191121998760",
  },
  {
    citation:
      "Schwartz, S. H. (2012). An Overview of the Schwartz Theory of Basic Values. Online Readings in Psychology and Culture, 2(1).",
    href: "https://doi.org/10.9707/2307-0919.1116",
  },
] as const;

function describeDashboardError(error: string) {
  if (/authentication required/i.test(error)) {
    return "Please refresh the page and try again.";
  }

  return error;
}

function compareSentenceForBelief(item: PolarScaleResult) {
  return item.percentileDirection === "higher"
    ? `You see the world as more ${item.highLabel} than ${item.percentileMagnitude}% of people.`
    : `You see the world as more ${item.lowLabel} than ${item.percentileMagnitude}% of people.`;
}

function percentileSentence(item: { percentileDirection: "higher" | "lower"; percentileMagnitude: number }) {
  return item.percentileDirection === "higher"
    ? `You scored higher than ${item.percentileMagnitude} percent of people.`
    : `You scored lower than ${item.percentileMagnitude} percent of people.`;
}

function valueRowSentence(item: ValuesScaleResult) {
  return item.percentileDirection === "higher"
    ? `Higher than ${item.percentileMagnitude}% of people.`
    : `Lower than ${item.percentileMagnitude}% of people.`;
}

function formatPolarTitle(item: PolarScaleResult) {
  return `${item.highLabel} vs. ${item.lowLabel}`;
}

function getBeliefSectionItems(results: BeliefsResultTab, summaryId: keyof typeof BELIEF_SECTION_LOOKUP) {
  const group = results.tertiaryGroups.find((entry) => entry.id === BELIEF_SECTION_LOOKUP[summaryId]);

  if (!group) {
    throw new Error(`Missing beliefs dashboard group for ${summaryId}.`);
  }

  return group.items;
}

function getOrderedBeliefLevelThreeItems(results: BeliefsResultTab) {
  const lookup = new Map(
    [...results.tertiaryGroups.flatMap((group) => group.items), ...results.neutralPrimals].map((item) => [
      item.id,
      item,
    ]),
  );

  return BELIEF_LEVEL_THREE_ORDER.map((id) => {
    const match = lookup.get(id);

    if (!match) {
      throw new Error(`Missing Level 3 belief result for ${id}.`);
    }

    return match;
  });
}

function EmptyDashboard({ ctaHref }: { ctaHref: string }) {
  return (
    <section
      className="clay-section mt-6 px-8 py-10 sm:px-12"
      style={{ background: "var(--hero-gradient)" }}
    >
      <p className="clay-label">
        No submission yet
      </p>
      <h1 className="mt-4 font-display text-5xl text-[var(--ink)] sm:text-6xl">
        Your results dashboard appears after you submit the survey.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--ink-soft)]">
        Complete the beliefs and values survey to generate the tabbed dashboard for this account.
      </p>
      <Link
        href={ctaHref}
        className="clay-button-hover mt-8 inline-flex rounded-full border border-black bg-[var(--accent-blue)] px-5 py-3 text-sm font-semibold text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]"
      >
        Start a survey →
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
    <div data-print-hide className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="clay-label">
            Completed surveys
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            Open any saved submission stored for this account.
          </p>
        </div>
        <p className="rounded-full border border-dashed border-[var(--line)] bg-[var(--surface-panel-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink)]">
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
                "w-full rounded-[1rem] border px-4 py-4 text-left shadow-[var(--shadow-soft)] transition",
                isActive
                  ? "border-[var(--line-strong)] bg-[var(--surface-panel-strong)] shadow-[var(--shadow-soft)]"
                  : "border-[var(--line)] bg-[var(--surface-panel)] hover:border-[var(--line-strong)]",
                isSwitchingSubmission && !isActive ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="clay-label">
                    {index === 0 ? "Most recent" : "Saved submission"}
                  </p>
                  <p className="mt-2 text-base font-semibold text-[var(--ink)]">
                    {formatSubmittedAt(submission.submittedAt)}
                  </p>
                </div>
                <span
                  className={[
                    "rounded-full border border-black px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
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

function BeliefsNarrative({ results }: { results: ValuesBeliefsResults["beliefs"] }) {
  const strongest = results.narrative.strongest;
  const weakest = results.narrative.weakest;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <p className="text-base leading-8 text-[var(--ink-soft)]">
        {strongest ? (
          <>
            Your strongest belief is that the world is{" "}
            <span className="font-semibold text-[var(--ink)]">{strongest.highLabel}</span>, which
            means {strongest.description.toLowerCase()}.
          </>
        ) : null}
        {results.narrative.strongestOthers.length > 0 ? (
          <> You also scored strongly on {results.narrative.strongestOthers.map((item) => item.highLabel).join(", ")}.</>
        ) : null}
      </p>
      <p className="text-base leading-8 text-[var(--ink-soft)]">
        {weakest ? (
          <>
            Your weakest belief is that the world is{" "}
            <span className="font-semibold text-[var(--ink)]">{weakest.highLabel}</span>, which
            suggests {weakest.description.toLowerCase()}.
          </>
        ) : null}
        {results.narrative.weakestOthers.length > 0 ? (
          <> You also expressed weaker views on {results.narrative.weakestOthers.map((item) => item.highLabel).join(", ")}.</>
        ) : null}
      </p>
    </div>
  );
}

function ValuesNarrative({ results }: { results: ValuesBeliefsResults["values"] }) {
  const strongest = results.narrative.strongest;
  const weakest = results.narrative.weakest;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <p className="text-base leading-8 text-[var(--ink-soft)]">
        {strongest ? (
          <>
            Your highest score was on{" "}
            <span className="font-semibold text-[var(--ink)]">{strongest.label}</span>, indicating{" "}
            {strongest.description.toLowerCase()}.
          </>
        ) : null}
        {results.narrative.strongestOthers.length > 0 ? (
          <> You also scored highly on {results.narrative.strongestOthers.map((item) => item.label).join(", ")}.</>
        ) : null}
      </p>
      <p className="text-base leading-8 text-[var(--ink-soft)]">
        {weakest ? (
          <>
            Your lowest score was on{" "}
            <span className="font-semibold text-[var(--ink)]">{weakest.label}</span>, suggesting{" "}
            {weakest.description.toLowerCase()}.
          </>
        ) : null}
        {results.narrative.weakestOthers.length > 0 ? (
          <> You also scored lower on {results.narrative.weakestOthers.map((item) => item.label).join(", ")}.</>
        ) : null}
      </p>
    </div>
  );
}

function TabReferences({
  references,
}: {
  references: readonly { citation: string; href: string }[];
}) {
  return (
    <section data-print-hide className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        More information about the science behind this survey can be found here:
      </p>
      <div className="mt-5 space-y-5 text-[15px] leading-7 text-[var(--ink-soft)]">
        {references.map((reference) => (
          <p key={reference.href}>
            {reference.citation}{" "}
            <a
              href={reference.href}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[var(--line-strong)] underline-offset-4 transition hover:text-[var(--accent-coral)]"
            >
              {reference.href}
            </a>
          </p>
        ))}
      </div>
    </section>
  );
}

function BeliefsIntro({ results }: { results: ValuesBeliefsResults["beliefs"] }) {
  return (
    <section data-print-hide className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        Showing score estimates for Beliefs.
      </p>
      <p className="mt-4 text-base leading-8 text-[var(--ink-soft)]">
        The Primal World Beliefs survey generates scores on three different levels. At all levels,
        scores range from 0 to 50, and percentiles indicate how your scores compare to a large
        sample of previous respondents.
      </p>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-[1rem] border border-dashed border-[var(--line)] bg-[var(--surface-panel-strong)] px-4 py-4">
          <p className="clay-label">
            Level 1
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            Your responses are scored to show how much you view the world as Good vs. Bad.
          </p>
        </div>
        <div className="rounded-[1rem] border border-dashed border-[var(--line)] bg-[var(--surface-panel-strong)] px-4 py-4">
          <p className="clay-label">
            Level 2
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            This level has three dimensions: the extent to which you view the world as Safe vs.
            Dangerous, Enticing vs. Dull, and Alive vs. Mechanistic.
          </p>
        </div>
        <div className="rounded-[1rem] border border-dashed border-[var(--line)] bg-[var(--surface-panel-strong)] px-4 py-4">
          <p className="clay-label">
            Level 3
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            The lowest level has 22 dimensions. Most can be thought of as more specific aspects of
            the Level 2 dimensions, while some are neutral primals.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <BeliefsNarrative results={results} />
      </div>
    </section>
  );
}

function ValuesIntro({ results }: { results: ValuesBeliefsResults["values"] }) {
  return (
    <section data-print-hide className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        Showing score estimates for Values.
      </p>
      <p className="mt-4 text-base leading-8 text-[var(--ink-soft)]">
        The Portrait Values Questionnaire assesses 19 basic values and four higher-order values.
        Scores for both levels range from 0 to 50, and percentiles indicate how your results
        compare to a reference sample of previous respondents.
      </p>
      <p className="mt-4 text-base leading-8 text-[var(--ink-soft)]">
        The higher-order values form two broad dimensions: Openness to Change contrasts with
        Conservation, and Self-Transcendence contrasts with Self-Enhancement.
      </p>
      <div className="mt-6">
        <ValuesNarrative results={results} />
      </div>
    </section>
  );
}

type ValuesBeliefsDashboardShellProps = {
  survey: Pick<ActiveSurveyDefinition, "type" | "title" | "route" | "resultsTitle">;
  initialPayload: ResultsPayload<ValuesBeliefsResults>;
};

export function ValuesBeliefsDashboardShell({
  survey,
  initialPayload,
}: ValuesBeliefsDashboardShellProps) {
  const [results, setResults] = useState<ValuesBeliefsResults | null>(initialPayload.results ?? null);
  const [submissions, setSubmissions] = useState<SurveySubmissionSummary[]>(
    initialPayload.submissions ?? [],
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>("beliefs");
  const [isSwitchingSubmission, setIsSwitchingSubmission] = useState(false);
  const [error, setError] = useState<string | null>(initialPayload.error ?? null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(
    initialPayload.selectedSubmissionId ?? initialPayload.results?.submission.submissionId ?? null,
  );
  const pendingResultsKey = getPendingResultsKey(survey.type);
  const storedAnswersKey = getStoredAnswersKey(survey.type);
  const surveyApiBasePath = getSurveyApiBasePath(survey.type);

  useEffect(() => {
    if (!results) {
      return;
    }

    window.sessionStorage.removeItem(pendingResultsKey);
    window.sessionStorage.removeItem(storedAnswersKey);
  }, [pendingResultsKey, results, storedAnswersKey]);

  const applyResultsPayload = useCallback((payload: ResultsPayload<ValuesBeliefsResults>) => {
    if (payload.results) {
      window.sessionStorage.removeItem(pendingResultsKey);
      window.sessionStorage.removeItem(storedAnswersKey);
    }

    setResults(payload.results);
    setSubmissions(payload.submissions ?? []);
    setSelectedSubmissionId(payload.selectedSubmissionId ?? payload.results?.submission.submissionId ?? null);
    setSelectionError(null);
    setError(null);
  }, [pendingResultsKey, storedAnswersKey]);

  const fetchResultsPayload = useCallback(async (submissionId?: string) => {
    const search = submissionId ? `?submissionId=${encodeURIComponent(submissionId)}` : "";
    const response = await fetch(`${surveyApiBasePath}/results${search}`, {
      cache: "no-store",
      credentials: "include",
    });
    const payload = (await response.json()) as ResultsPayload<ValuesBeliefsResults>;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load the saved survey results.");
    }

    return payload;
  }, [surveyApiBasePath]);

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

  return (
    <>
      <SiteTopNav
        breadcrumbItems={[
          { label: "Surveys", href: SURVEYS_ROUTE },
          { label: survey.title, href: survey.route },
          { label: "Survey Results" },
        ]}
        action={
          <Link
            href={SURVEYS_ROUTE}
            className="clay-button-hover inline-flex h-11 items-center justify-center rounded-full border border-black bg-[var(--accent-blue)] px-5 text-sm font-semibold text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]"
          >
            Start a survey →
          </Link>
        }
      />

      {error ? (
        <section
          className="clay-section mt-6 px-8 py-10 sm:px-12"
          style={{ background: "var(--hero-gradient)" }}
        >
          <p className="clay-label">
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

      {!error && !results ? <EmptyDashboard ctaHref={SURVEYS_ROUTE} /> : null}

      {!error && results ? (
        <div className="mt-6 space-y-6">
          <DashboardPrintHeader
            surveyTitle={survey.title}
            resultsTitle={survey.resultsTitle}
            submittedAt={results.submission.submittedAt}
            answerCount={results.submission.answerCount}
          />
          <section
            data-print-hide
            className="clay-section overflow-hidden px-5 py-6 sm:px-8 sm:py-8"
            style={{ background: "var(--hero-gradient)" }}
          >
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_22rem] xl:items-start">
              <div>
                <p className="clay-label">
                  Survey Results
                </p>
                <h1 className="mt-4 font-display text-4xl text-[var(--ink)] sm:text-5xl">
                  {survey.resultsTitle}
                </h1>
                <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--ink-soft)]">
                  Beliefs about the nature of the world shape our decisions, emotions, and reactions
                  to daily events. Values guide our behavior by determining the relative importance of
                  different goals. Use the tabs below to switch between Beliefs and Values.
                </p>
                <p className="mt-3 max-w-4xl text-[15px] leading-7 text-[var(--ink-soft)]">
                  Please note that the results provided below are for informational purposes only, and
                  are not intended to be psychological or medical advice. The accuracy or completeness
                  of the results are not guaranteed.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)]">
                <p className="clay-label">
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
                  <DashboardPdfButton
                    fileName={`Ciao - ${survey.title} - ${formatSubmittedAt(results.submission.submittedAt)}.pdf`}
                  />
                  <a
                    href="https://doi.org/10.1037/pas0000639"
                    target="_blank"
                    rel="noreferrer"
                    className="clay-button-hover inline-flex rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-soft)]"
                  >
                    Beliefs source
                  </a>
                  <a
                    href="https://doi.org/10.1177/1073191121998760"
                    target="_blank"
                    rel="noreferrer"
                    className="clay-button-hover inline-flex rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-soft)]"
                  >
                    Values source
                  </a>
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
          </section>

          <section data-print-hide className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-4 py-3 shadow-[var(--shadow-soft)] sm:px-5">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {(["beliefs", "values"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={[
                    "rounded-full px-4 py-2.5 text-lg font-semibold uppercase tracking-[0.08em] transition",
                    activeTab === tab
                      ? "bg-[var(--accent-coral)] text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]"
                      : "text-[var(--ink)] hover:bg-[var(--surface-panel-strong)]",
                  ].join(" ")}
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>

          {activeTab === "beliefs" ? (
            <section className="space-y-6">
              <BeliefsIntro results={results.beliefs} />

              <BeliefsLevelSummaryViolin
                groups={[
                  {
                    id: "level-1",
                    label: "Level 1",
                    items: [results.beliefs.primary],
                  },
                  {
                    id: "level-2",
                    label: "Level 2",
                    items: results.beliefs.secondary,
                  },
                  {
                    id: "level-3",
                    label: "Level 3",
                    items: getOrderedBeliefLevelThreeItems(results.beliefs),
                  },
                ]}
              />

              <DashboardGaugeCard
                title={BELIEF_CARD_COPY.good.title}
                description={BELIEF_CARD_COPY.good.description}
                sentence={compareSentenceForBelief(results.beliefs.primary)}
                score={results.beliefs.primary.score}
                band={results.beliefs.primary.band}
                reference={results.beliefs.primary.reference}
                lowLabel={results.beliefs.primary.lowLabel}
                highLabel={results.beliefs.primary.highLabel}
              />

              {results.beliefs.secondary.map((item) => (
                <DashboardGaugeCard
                  key={item.id}
                  title={BELIEF_CARD_COPY[item.id as keyof typeof BELIEF_CARD_COPY].title}
                  description={BELIEF_CARD_COPY[item.id as keyof typeof BELIEF_CARD_COPY].description}
                  sentence={compareSentenceForBelief(item)}
                  score={item.score}
                  band={item.band}
                  reference={item.reference}
                  lowLabel={item.lowLabel}
                  highLabel={item.highLabel}
                >
                  <div className="divide-y divide-[var(--line)]">
                    {getBeliefSectionItems(
                      results.beliefs,
                      item.id as keyof typeof BELIEF_SECTION_LOOKUP,
                    ).map((entry) => (
                      <SegmentedScoreRow
                        key={entry.id}
                        title={formatPolarTitle(entry)}
                        description={entry.description}
                        score={entry.score}
                        band={entry.band}
                        sentence={entry.comparisonText}
                        lowLabel={entry.lowLabel}
                        highLabel={entry.highLabel}
                      />
                    ))}
                  </div>
                </DashboardGaugeCard>
              ))}

              <section data-pdf-capture className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7">
                <h2 className="font-display text-3xl text-[var(--ink)]">Neutral Primals</h2>
                <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--ink-soft)]">
                  Several primal beliefs are unrelated to the 3 secondary dimensions described above.
                  These are known as neutral primals.
                </p>
                <div className="mt-6 divide-y divide-[var(--line)]">
                  {results.beliefs.neutralPrimals.map((item) => (
                    <SegmentedScoreRow
                      key={item.id}
                      title={formatPolarTitle(item)}
                      description={item.description}
                      score={item.score}
                      band={item.band}
                      sentence={item.comparisonText}
                      lowLabel={item.lowLabel}
                      highLabel={item.highLabel}
                    />
                  ))}
                </div>
              </section>

              <TabReferences references={BELIEFS_REFERENCES} />
            </section>
          ) : (
            <section className="space-y-6">
              <ValuesIntro results={results.values} />

              {results.values.groups.map((group) => (
                <DashboardGaugeCard
                  key={group.id}
                  title={group.title}
                  description={group.description}
                  sentence={percentileSentence(group.summary)}
                  score={group.summary.score}
                  band={group.summary.band}
                  reference={group.summary.reference}
                >
                  <div className="divide-y divide-[var(--line)]">
                    {group.items.map((item) => (
                      <SegmentedScoreRow
                        key={item.id}
                        title={item.label}
                        description={item.description}
                        score={item.score}
                        band={item.band}
                        sentence={valueRowSentence(item)}
                      />
                    ))}
                  </div>
                </DashboardGaugeCard>
              ))}

              <section data-pdf-capture className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-6 sm:py-7">
                <h2 className="font-display text-3xl text-[var(--ink)]">Other values</h2>
                <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--ink-soft)]">
                  These values are not included in any of the sections above.
                </p>
                <div className="mt-6 divide-y divide-[var(--line)]">
                  {results.values.otherValues.map((item) => (
                    <SegmentedScoreRow
                      key={item.id}
                      title={item.label}
                      description={item.description}
                      score={item.score}
                      band={item.band}
                      sentence={valueRowSentence(item)}
                    />
                  ))}
                </div>
              </section>

              <TabReferences references={VALUES_REFERENCES} />
            </section>
          )}
        </div>
      ) : null}
    </>
  );
}
