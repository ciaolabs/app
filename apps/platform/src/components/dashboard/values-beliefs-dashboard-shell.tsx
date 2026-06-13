"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BeliefsLevelSummaryViolin } from "@/components/dashboard/beliefs-level-summary-violin";
import { DashboardGaugeCard } from "@/components/dashboard/dashboard-gauge-card";
import { SegmentedScoreRow } from "@/components/dashboard/segmented-score-row";
import {
  describeDashboardError,
  SubmissionHistoryList,
  SurveyDashboardLayout,
} from "@/components/dashboard/survey-dashboard-layout";
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
import { apiRoutes } from "@/lib/routes";
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
  const surveyApiBasePath = apiRoutes.surveyBase(survey.type);
  const hasSyncedLatestResults = useRef(false);

  useEffect(() => {
    if (!results) {
      return;
    }

    if (window.sessionStorage.getItem(pendingResultsKey)) {
      return;
    }

    window.sessionStorage.removeItem(storedAnswersKey);
  }, [pendingResultsKey, results, storedAnswersKey]);

  const applyResultsPayload = useCallback((payload: ResultsPayload<ValuesBeliefsResults>) => {
    window.sessionStorage.removeItem(pendingResultsKey);

    if (payload.results) {
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

  useEffect(() => {
    if (error || hasSyncedLatestResults.current) {
      return;
    }

    const hasPendingSubmission = Boolean(window.sessionStorage.getItem(pendingResultsKey));

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
  }, [applyResultsPayload, error, fetchResultsPayload, pendingResultsKey, results]);

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

  const submission = results
    ? {
        submittedAt: results.submission.submittedAt,
        answerCount: results.submission.answerCount,
        submissionId: results.submission.submissionId,
      }
    : null;

  return (
    <SurveyDashboardLayout
      survey={survey}
      error={error}
      hasResults={!!results}
      submission={submission}
      heroDescription={
        <>
          <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--ink-soft)] font-semibold">
            Beliefs about the nature of the world shape our decisions, emotions, and reactions
            to daily events. Values guide our behavior by determining the relative importance of
            different goals.
          </p>
          <p className="mt-3 max-w-4xl text-[15px] leading-7 text-[var(--ink-soft)] font-semibold">
            Please note that the results provided below are for informational purposes only, and
            are not intended to be psychological or medical advice. The accuracy or completeness
            of the results are not guaranteed.
          </p>
        </>
      }
      heroActionLinks={
        <>
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
        </>
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
    >
      {results ? (
        <>
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
                    : "bg-[var(--surface-panel-strong)] text-[var(--ink)]",
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </div>

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
        </>
      ) : null}
    </SurveyDashboardLayout>
  );
}
