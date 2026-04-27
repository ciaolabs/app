"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { SiteTopNav } from "@/components/site-top-nav";
import { LikertScale } from "@/components/survey/likert-scale";
import { QuestionLog } from "@/components/survey/question-log";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ShortcutKey,
} from "@/components/survey/survey-keycaps";
import { ViolinPlot } from "@/components/survey/violin-plot";
import { formatTime } from "@/lib/date-format";
import {
  getPendingResultsKey,
  getStoredAnswersKey,
  type ActiveSurveyDefinition,
} from "@/lib/survey/definitions";
import { getSurveyApiBasePath, SURVEYS_ROUTE } from "@/lib/survey/routes";
import { LikertValue, QuestionItem, SurveyAnswers, SurveyDraft } from "@/lib/survey/types";

const SurveyHelpDialog = dynamic(() => import("@/components/survey/survey-help-dialog"), {
  ssr: false,
});

type SurveyShellProps = {
  survey: Pick<
    ActiveSurveyDefinition,
    "type" | "title" | "dashboardRoute" | "helpContent" | "sections"
  >;
  questions: readonly QuestionItem[];
  initialDraft: SurveyDraft;
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

function findFirstUnansweredIndex(
  questions: readonly QuestionItem[],
  answers: SurveyAnswers,
) {
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
    return `Saved at ${formatTime(lastSavedAt)}`;
  }

  return "Autosaves to your account.";
}

export function SurveyShell({ survey, questions, initialDraft }: SurveyShellProps) {
  const router = useRouter();
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
  const pendingControllers = useRef<Map<string, AbortController>>(new Map());
  const saveVersions = useRef<Map<string, number>>(new Map());
  const deferredAnswers = useDeferredValue(answers);
  const storedAnswersKey = getStoredAnswersKey(survey.type);
  const pendingResultsKey = getPendingResultsKey(survey.type);
  const surveyApiBasePath = getSurveyApiBasePath(survey.type);

  const sectionBounds = useMemo(() => {
    const map = new Map<string, { start: number; end: number }>();
    for (let i = 0; i < questions.length; i++) {
      const id = questions[i].section?.id;
      if (!id) continue;
      const entry = map.get(id);
      if (!entry) {
        map.set(id, { start: i, end: i });
      } else {
        entry.end = i;
      }
    }
    return map;
  }, [questions]);

  const answeredCount = Object.keys(answers).length;
  const completion = Math.round((answeredCount / questions.length) * 100);
  const firstUnansweredIndex = useMemo(
    () => questions.findIndex((question) => !answers[question.id]),
    [questions, answers],
  );
  const hasUnansweredQuestions = firstUnansweredIndex !== -1;
  const currentQuestion = questions[activeIndex];
  const currentAnswer = answers[currentQuestion.id];
  const currentResponseLabels = useMemo(
    () => currentQuestion.responseScale.options.map((option) => option.label),
    [currentQuestion.responseScale],
  );
  const currentSection = currentQuestion.section ?? null;
  const { sectionStartIndex, sectionEndIndex } = useMemo(() => {
    if (!currentSection) {
      return { sectionStartIndex: 0, sectionEndIndex: questions.length - 1 };
    }
    const bounds = sectionBounds.get(currentSection.id);
    return bounds
      ? { sectionStartIndex: bounds.start, sectionEndIndex: bounds.end }
      : { sectionStartIndex: 0, sectionEndIndex: questions.length - 1 };
  }, [currentSection, sectionBounds, questions.length]);
  const isSectionStart = activeIndex === sectionStartIndex;
  const sectionAnsweredCount = useMemo(() => {
    if (!currentSection) {
      return answeredCount;
    }
    let count = 0;
    for (let i = sectionStartIndex; i <= sectionEndIndex; i++) {
      if (answers[questions[i].id]) {
        count++;
      }
    }
    return count;
  }, [currentSection, answers, questions, sectionStartIndex, sectionEndIndex, answeredCount]);
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
    async (questionId: string, questionOrder: number, value: LikertValue, saveVersion: number) => {
      const controller = new AbortController();
      pendingControllers.current.set(questionId, controller);

      try {
        const response = await surveyFetch(`${surveyApiBasePath}/answer`, {
          method: "PUT",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            submissionId: initialDraft.submissionId,
            questionId,
            questionOrder,
            value,
          }),
        });
        const payload = (await response.json()) as { draft?: SurveyDraft; error?: string };

        if (!response.ok || !payload.draft) {
          throw new Error(payload.error ?? "Unable to save your answer.");
        }

        if (saveVersions.current.get(questionId) === saveVersion) {
          setLastSavedAt(payload.draft.updatedAt);
          setSaveError(null);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (saveVersions.current.get(questionId) !== saveVersion) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unable to save your answer.";
        setSaveError(message);
      } finally {
        if (pendingControllers.current.get(questionId) === controller) {
          pendingControllers.current.delete(questionId);
        }

        if (saveVersions.current.get(questionId) === saveVersion) {
          pendingSaveIds.current.delete(questionId);
          setPendingSaveCount(pendingSaveIds.current.size);
        }
      }
    },
    [initialDraft.submissionId, surveyApiBasePath, surveyFetch],
  );

  useEffect(() => {
    router.prefetch(survey.dashboardRoute);
  }, [router, survey.dashboardRoute]);

  useEffect(() => {
    if (hasPendingResults(pendingResultsKey)) {
      router.push(survey.dashboardRoute);
      return;
    }

    const storedAnswers = readStoredAnswers(storedAnswersKey);

    if (Object.keys(storedAnswers).length > Object.keys(initialDraft.answers).length) {
      setAnswers(storedAnswers);
      setActiveIndex(findFirstUnansweredIndex(questions, storedAnswers));
    }

    const timerMap = pendingTimers.current;
    const controllerMap = pendingControllers.current;

    return () => {
      timerMap.forEach((timerId) => window.clearTimeout(timerId));
      timerMap.clear();
      controllerMap.forEach((controller) => controller.abort());
      controllerMap.clear();
    };
  }, [
    initialDraft.answers,
    pendingResultsKey,
    questions,
    router,
    storedAnswersKey,
    survey.dashboardRoute,
  ]);

  const queueSave = useCallback(
    (questionId: string, questionOrder: number, value: LikertValue) => {
      const existingTimer = pendingTimers.current.get(questionId);

      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      pendingControllers.current.get(questionId)?.abort();
      const saveVersion = (saveVersions.current.get(questionId) ?? 0) + 1;
      saveVersions.current.set(questionId, saveVersion);
      pendingSaveIds.current.add(questionId);
      setPendingSaveCount(pendingSaveIds.current.size);

      const timerId = window.setTimeout(() => {
        pendingTimers.current.delete(questionId);
        void persistAnswer(questionId, questionOrder, value, saveVersion);
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

  const keydownHandlersRef = useRef({
    goToNextQuestion,
    goToPreviousQuestion,
    handleSelectAnswer,
  });
  useEffect(() => {
    keydownHandlersRef.current = {
      goToNextQuestion,
      goToPreviousQuestion,
      handleSelectAnswer,
    };
  });

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

      const handlers = keydownHandlersRef.current;

      if (/^[1-6]$/.test(event.key)) {
        event.preventDefault();
        handlers.handleSelectAnswer(Number(event.key) as LikertValue);
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        handlers.goToNextQuestion();
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        handlers.goToPreviousQuestion();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isHelpOpen, isSubmitting]);

  async function handleSubmit() {
    if (answeredCount !== questions.length || isSubmitting) {
      return;
    }

    pendingTimers.current.forEach((timerId) => window.clearTimeout(timerId));
    pendingTimers.current.clear();
    pendingControllers.current.forEach((controller) => controller.abort());
    pendingControllers.current.clear();
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
      router.push(survey.dashboardRoute);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit your survey.";
      setSaveError(message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  }

  const breadcrumbItems = useMemo(
    () => [
      { label: "Surveys", href: SURVEYS_ROUTE },
      { label: survey.title },
    ],
    [survey.title],
  );

  const openHelp = useCallback(() => setIsHelpOpen(true), []);

  return (
    <>
      <div className="grid gap-6 lg:h-[calc(100svh-3rem)] lg:grid-rows-[auto_minmax(0,1fr)]">
        <SiteTopNav
          breadcrumbTitle={survey.title}
          breadcrumbItems={breadcrumbItems}
          saveStatus={saveStatus}
          saveStatusIsError={Boolean(saveError)}
          helpOnClick={openHelp}
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

        <div className="grid min-h-0 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
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
        <SurveyHelpDialog
          helpContent={survey.helpContent ?? null}
          onClose={() => setIsHelpOpen(false)}
        />
      ) : null}
    </>
  );
}
