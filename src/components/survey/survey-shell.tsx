"use client";

import {
  type ReactNode,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";

import { SiteTopNav } from "@/components/site-top-nav";
import { LikertScale } from "@/components/survey/likert-scale";
import { QuestionLog } from "@/components/survey/question-log";
import { ViolinPlot } from "@/components/survey/violin-plot";
import { navigateWithReload } from "@/lib/browser-navigation";
import {
  getPendingResultsKey,
  getStoredAnswersKey,
  type ActiveSurveyDefinition,
} from "@/lib/survey/definitions";
import { getSurveyApiBasePath, SURVEYS_ROUTE } from "@/lib/survey/routes";
import { LikertValue, QuestionItem, SurveyAnswers, SurveyDraft } from "@/lib/survey/types";

type SurveyShellProps = {
  survey: Pick<
    ActiveSurveyDefinition,
    "type" | "title" | "dashboardRoute" | "helpContent" | "sections"
  >;
  questions: QuestionItem[];
  initialDraft: SurveyDraft;
};

type ShortcutKeyProps = {
  children: ReactNode;
  wide?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

function readStoredAnswers(storageKey: string) {
  if (typeof window === "undefined") {
    return {};
  }

  const rawAnswers = window.sessionStorage.getItem(storageKey);

  if (!rawAnswers) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawAnswers) as Record<string, number>;
    return Object.fromEntries(
      Object.entries(parsed).map(([questionId, value]) => [questionId, Number(value)]),
    ) as SurveyAnswers;
  } catch {
    return {};
  }
}

function writeStoredAnswers(storageKey: string, answers: SurveyAnswers) {
  if (typeof window === "undefined") {
    return;
  }

  if (Object.keys(answers).length === 0) {
    window.sessionStorage.removeItem(storageKey);
    return;
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(answers));
}

function markPendingResults(storageKey: string, submittedAt: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    storageKey,
    submittedAt ?? new Date().toISOString(),
  );
}

function hasPendingResults(storageKey: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.sessionStorage.getItem(storageKey));
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M9.5 3.5 5 8l4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="m6.5 3.5 4.5 4.5-4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function findFirstUnansweredIndex(questions: QuestionItem[], answers: SurveyAnswers) {
  const unansweredIndex = questions.findIndex((question) => !answers[question.id]);
  return unansweredIndex === -1 ? questions.length - 1 : unansweredIndex;
}

function describeSaveState(
  pendingSaveCount: number,
  lastSavedAt: string | null,
  saveError: string | null,
) {
  if (saveError) {
    if (/authentication required/i.test(saveError)) {
      return "Please refresh the page.";
    }

    return saveError;
  }

  if (pendingSaveCount > 0) {
    return "Saving your draft...";
  }

  if (lastSavedAt) {
    return `Saved at ${new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(lastSavedAt))}`;
  }

  return "Autosaves to your account.";
}

function ShortcutKey({
  children,
  wide = false,
  onClick,
  disabled = false,
  ariaLabel,
}: ShortcutKeyProps) {
  const classes = [
    "inline-flex h-8 items-center justify-center rounded-[0.75rem] border border-[var(--line-strong)] bg-[var(--keycap-bg)] px-2.5 font-mono text-[11px] font-semibold text-black shadow-[var(--keycap-shadow)]",
    wide ? "min-w-[3.3rem]" : "min-w-[2.2rem]",
    onClick ? "transition hover:border-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-40" : "",
  ].join(" ");

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={classes}
      >
        {children}
      </button>
    );
  }

  return (
    <span
      className={[
        "inline-flex h-8 items-center justify-center rounded-[0.75rem] border border-[var(--line-strong)] bg-[var(--keycap-bg)] px-2.5 font-mono text-[11px] font-semibold text-black shadow-[var(--keycap-shadow)]",
        wide ? "min-w-[3.3rem]" : "min-w-[2.2rem]",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function SurveyShell({ survey, questions, initialDraft }: SurveyShellProps) {
  const [answers, setAnswers] = useState<SurveyAnswers>(initialDraft.answers);
  const [activeIndex, setActiveIndex] = useState(() =>
    findFirstUnansweredIndex(questions, initialDraft.answers),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialDraft.updatedAt);
  const [pendingSaveCount, setPendingSaveCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const pendingSaveIds = useRef(new Set<string>());
  const pendingTimers = useRef<Map<string, number>>(new Map());
  const deferredAnswers = useDeferredValue(answers);
  const storedAnswersKey = getStoredAnswersKey(survey.type);
  const pendingResultsKey = getPendingResultsKey(survey.type);
  const surveyApiBasePath = getSurveyApiBasePath(survey.type);

  const answeredCount = Object.keys(answers).length;
  const completion = Math.round((answeredCount / questions.length) * 100);
  const firstUnansweredIndex = questions.findIndex((question) => !answers[question.id]);
  const hasUnansweredQuestions = firstUnansweredIndex !== -1;
  const currentQuestion = questions[activeIndex];
  const currentAnswer = answers[currentQuestion.id];
  const currentResponseLabels = currentQuestion.responseScale.options.map((option) => option.label);
  const currentSection = currentQuestion.section ?? null;
  const sectionStartIndex = currentSection
    ? questions.findIndex((question) => question.section?.id === currentSection.id)
    : 0;
  const sectionEndIndex = currentSection
    ? questions.reduce((lastIndex, question, index) => {
        return question.section?.id === currentSection.id ? index : lastIndex;
      }, sectionStartIndex)
    : questions.length - 1;
  const isSectionStart = activeIndex === sectionStartIndex;
  const sectionAnsweredCount = currentSection
    ? questions.filter((question) => question.section?.id === currentSection.id && answers[question.id]).length
    : answeredCount;
  const sectionQuestionCount = currentSection ? sectionEndIndex - sectionStartIndex + 1 : questions.length;
  const sectionCompletion = Math.round((sectionAnsweredCount / sectionQuestionCount) * 100);

  const saveStatus = describeSaveState(pendingSaveCount, lastSavedAt, saveError);
  const surveyFetch = useCallback(async (input: string, init?: RequestInit) => {
    return fetch(input, {
      ...init,
      credentials: "include",
    });
  }, []);

  useEffect(() => {
    writeStoredAnswers(storedAnswersKey, answers);
  }, [answers, storedAnswersKey]);

  const persistAnswer = useCallback(
    async (questionId: string, questionOrder: number, value: LikertValue) => {
      try {
        const response = await surveyFetch(`${surveyApiBasePath}/answer`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionId,
            questionOrder,
            value,
          }),
        });
        const payload = (await response.json()) as { draft?: SurveyDraft; error?: string };

        if (!response.ok || !payload.draft) {
          throw new Error(payload.error ?? "Unable to save your answer.");
        }

        setLastSavedAt(payload.draft.updatedAt);
        setSaveError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to save your answer.";
        setSaveError(message);
      } finally {
        pendingSaveIds.current.delete(questionId);
        setPendingSaveCount(pendingSaveIds.current.size);
      }
    },
    [surveyApiBasePath, surveyFetch],
  );

  useEffect(() => {
    if (hasPendingResults(pendingResultsKey)) {
      navigateWithReload(survey.dashboardRoute);
      return;
    }

    const storedAnswers = readStoredAnswers(storedAnswersKey);

    if (Object.keys(storedAnswers).length > Object.keys(initialDraft.answers).length) {
      setAnswers(storedAnswers);
      setActiveIndex(findFirstUnansweredIndex(questions, storedAnswers));
    }

    const timerMap = pendingTimers.current;

    return () => {
      timerMap.forEach((timerId) => window.clearTimeout(timerId));
      timerMap.clear();
    };
  }, [initialDraft.answers, pendingResultsKey, questions, storedAnswersKey, survey.dashboardRoute]);

  const queueSave = useCallback(
    (questionId: string, questionOrder: number, value: LikertValue) => {
      const existingTimer = pendingTimers.current.get(questionId);

      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      pendingSaveIds.current.add(questionId);
      setPendingSaveCount(pendingSaveIds.current.size);

      const timerId = window.setTimeout(() => {
        pendingTimers.current.delete(questionId);
        void persistAnswer(questionId, questionOrder, value);
      }, 450);

      pendingTimers.current.set(questionId, timerId);
    },
    [persistAnswer],
  );

  const handleSelectAnswer = useCallback(
    (value: LikertValue) => {
      setAnswers((currentAnswers) => ({
        ...currentAnswers,
        [currentQuestion.id]: value,
      }));
      queueSave(currentQuestion.id, currentQuestion.order, value);
    },
    [currentQuestion.id, currentQuestion.order, queueSave],
  );

  const goToIndex = useCallback((index: number) => {
    startTransition(() => {
      setActiveIndex(index);
    });
  }, []);

  const goToNextQuestion = useCallback(() => {
    if (activeIndex < questions.length - 1) {
      goToIndex(activeIndex + 1);
    }
  }, [activeIndex, goToIndex, questions.length]);

  const goToPreviousQuestion = useCallback(() => {
    if (activeIndex > 0) {
      goToIndex(activeIndex - 1);
    }
  }, [activeIndex, goToIndex]);

  const goToFirstUnansweredQuestion = useCallback(() => {
    if (firstUnansweredIndex !== -1) {
      goToIndex(firstUnansweredIndex);
    }
  }, [firstUnansweredIndex, goToIndex]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isHelpOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          setIsHelpOpen(false);
        }

        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName ?? "";

      if (
        target?.isContentEditable ||
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT"
      ) {
        return;
      }

      if (isSubmitting) {
        return;
      }

      if (/^[1-6]$/.test(event.key)) {
        event.preventDefault();
        handleSelectAnswer(Number(event.key) as LikertValue);
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        goToNextQuestion();
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        goToPreviousQuestion();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    goToNextQuestion,
    goToPreviousQuestion,
    handleSelectAnswer,
    isHelpOpen,
    isSubmitting,
  ]);

  async function handleSubmit() {
    if (answeredCount !== questions.length || isSubmitting) {
      return;
    }

    pendingTimers.current.forEach((timerId) => window.clearTimeout(timerId));
    pendingTimers.current.clear();
    pendingSaveIds.current.clear();
    setPendingSaveCount(0);
    setIsSubmitting(true);

    try {
      const response = await surveyFetch(`${surveyApiBasePath}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });
      const payload = (await response.json()) as {
        submission?: { submittedAt: string };
        error?: string;
      };

      if (!response.ok || !payload.submission) {
        throw new Error(payload.error ?? "Unable to submit your survey.");
      }

      markPendingResults(pendingResultsKey, payload.submission.submittedAt ?? null);
      navigateWithReload(survey.dashboardRoute);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit your survey.";
      setSaveError(message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  }

  const breadcrumbItems = [
    { label: "Surveys", href: SURVEYS_ROUTE },
    { label: survey.title },
  ];

  return (
    <>
      <div className="grid gap-4 lg:h-[calc(100svh-2rem)] lg:grid-rows-[auto_minmax(0,1fr)]">
        <SiteTopNav
          breadcrumbTitle={survey.title}
          breadcrumbItems={breadcrumbItems}
          saveStatus={saveStatus}
          saveStatusIsError={Boolean(saveError)}
          helpOnClick={() => setIsHelpOpen(true)}
          helpExpanded={isHelpOpen}
          action={
            <button
              type="button"
              onClick={handleSubmit}
              disabled={answeredCount !== questions.length || isSubmitting}
              className="clay-button-hover inline-flex h-11 items-center justify-center rounded-full border border-black bg-[var(--accent-sand)] px-5 text-sm font-semibold text-[var(--selected-contrast)] shadow-[var(--shadow-soft)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "Submitting..." : "Submit survey"}
            </button>
          }
        />

        <div className="grid min-h-0 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="min-h-0 lg:h-full">
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] backdrop-blur">
              <div className="shrink-0 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="clay-label">
                    Survey progress
                  </p>
                  <button
                    type="button"
                    onClick={goToFirstUnansweredQuestion}
                    disabled={!hasUnansweredQuestions || isSubmitting}
                    className="clay-button-hover inline-flex rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink)] shadow-[var(--shadow-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    First unanswered
                  </button>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-5xl text-[var(--ink)]">{answeredCount}</p>
                    <p className="text-sm text-[var(--ink-soft)]">
                      of {questions.length} prompts answered
                    </p>
                  </div>
                  <p className="rounded-full border border-black bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]">
                    {completion}%
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-inset)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-mint)] transition-all duration-300"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 min-h-0 flex-1 overflow-hidden">
                <QuestionLog
                  questions={questions}
                  answers={deferredAnswers}
                  activeIndex={activeIndex}
                  onSelect={goToIndex}
                />
              </div>
            </div>
          </aside>

          <main className="min-h-0">
            <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] shadow-[var(--shadow-strong)] backdrop-blur">
              <div className="border-b border-[var(--line)] px-6 py-4 sm:px-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="clay-label">
                      Question {currentQuestion.order} of {questions.length}
                    </p>
                    {currentSection ? (
                      <span className="rounded-full border border-dashed border-[var(--line)] bg-[var(--surface-panel-strong)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)]">
                        {currentSection.shortTitle ?? currentSection.title}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    <span>Keys</span>
                    <ShortcutKey wide>1-6</ShortcutKey>
                    <span>Answer</span>
                    <ShortcutKey
                      onClick={goToPreviousQuestion}
                      disabled={activeIndex === 0}
                      ariaLabel="Go to previous question"
                    >
                      <ArrowLeftIcon />
                    </ShortcutKey>
                    <span>Previous</span>
                    <ShortcutKey
                      onClick={goToNextQuestion}
                      disabled={activeIndex === questions.length - 1}
                      ariaLabel="Go to next question"
                    >
                      <ArrowRightIcon />
                    </ShortcutKey>
                    <span>Next</span>
                  </div>
                </div>
                {currentSection ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-dashed border-[var(--line)] bg-[var(--surface-panel-strong)] px-4 py-3">
                    <div>
                      <p className="clay-label">
                        {currentSection.eyebrow ?? "Survey section"}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[var(--ink)]">
                        {currentSection.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {sectionAnsweredCount} of {sectionQuestionCount}
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        {sectionCompletion}% complete
                      </p>
                    </div>
                  </div>
                ) : null}
                <h1 className="mt-2 font-display text-[2rem] leading-tight text-[var(--ink)] sm:text-[2.4rem]">
                  {currentQuestion.prompt}
                </h1>
                {isSectionStart && currentSection?.description ? (
                  <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--ink-soft)]">
                    {currentSection.description}
                  </p>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 px-6 py-5 sm:px-7">
                {currentAnswer ? (
                  <div className="flex h-full min-h-0 flex-col gap-4">
                    <LikertScale
                      responseScale={currentQuestion.responseScale}
                      selectedValue={currentAnswer}
                      onSelect={handleSelectAnswer}
                      variant="compact"
                    />

                    {currentQuestion.visual?.kind === "violin" ? (
                      <div className="min-h-0 flex-1 motion-safe:animate-[fadeIn_380ms_ease-out]">
                        <ViolinPlot
                          distribution={currentQuestion.visual.distribution}
                          labels={currentResponseLabels}
                          selectedValue={currentAnswer}
                          className="h-full"
                        />
                      </div>
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-[var(--surface-panel-strong)] px-5 py-5 text-[var(--ink-soft)] motion-safe:animate-[fadeIn_320ms_ease-out]">
                        <p className="clay-label">
                          Response saved
                        </p>
                        <p className="mt-3 max-w-3xl text-base leading-7">
                          Your answer is stored with your draft. Use the arrow keys or the progress rail
                          to continue through {currentSection?.title ?? "the survey"}.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full">
                    <LikertScale
                      responseScale={currentQuestion.responseScale}
                      onSelect={handleSelectAnswer}
                      variant="hero"
                    />
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>

      {isHelpOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 px-5 py-8 backdrop-blur-sm sm:items-center">
          <div
            id="survey-help-panel"
            role="dialog"
            aria-modal="true"
            className="w-full max-w-xl rounded-[1.5rem] border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] p-6 shadow-[var(--shadow-strong)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="clay-label">
                  Documentation
                </p>
                <h2 className="mt-2 font-display text-4xl text-[var(--ink)]">Survey help</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="clay-button-hover inline-flex h-11 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel)] px-3 text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-soft)]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm leading-7 text-[var(--ink-soft)]">
              <p>
                {survey.helpContent?.body}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-black bg-[var(--accent-lilac)] p-4 text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    <ShortcutKey wide>1-6</ShortcutKey>
                    <span>Answer</span>
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-black bg-[var(--accent-mint)] p-4 text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    <ShortcutKey>
                      <ArrowLeftIcon />
                    </ShortcutKey>
                    <span>Previous</span>
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-black bg-[var(--accent-lime)] p-4 text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    <ShortcutKey>
                      <ArrowRightIcon />
                    </ShortcutKey>
                    <span>Next</span>
                  </div>
                </div>
              </div>
              {survey.helpContent ? (
                <>
                  <p>{survey.helpContent.referencesIntro}</p>
                  <div className="flex flex-wrap gap-3">
                    {survey.helpContent.references.map((reference) => (
                      <a
                        key={reference.href}
                        href={reference.href}
                        target="_blank"
                        rel="noreferrer"
                        className="clay-button-hover inline-flex items-center rounded-full border border-black bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]"
                      >
                        {reference.label}
                      </a>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
