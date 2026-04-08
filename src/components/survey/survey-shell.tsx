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
import { useAuth } from "@clerk/nextjs";

import { SiteTopNav } from "@/components/site-top-nav";
import { LikertScale } from "@/components/survey/likert-scale";
import { QuestionLog } from "@/components/survey/question-log";
import { ViolinPlot } from "@/components/survey/violin-plot";
import { navigateWithReload } from "@/lib/browser-navigation";
import { SURVEY_RESULTS_ROUTE } from "@/lib/survey/routes";
import { LikertValue, QuestionItem, SurveyAnswers, SurveyDraft } from "@/lib/survey/types";

type SurveyShellProps = {
  questions: QuestionItem[];
  initialDraft: SurveyDraft | null;
};

type ShortcutKeyProps = {
  children: ReactNode;
  wide?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

const DOCUMENTATION_URL = "https://doi.org/10.1016/j.jrp.2010.01.002";
const SURVEY_ANSWERS_STORAGE_KEY = "ambi-survey-answers";
const PENDING_RESULTS_STORAGE_KEY = "ambi-pending-results";

function readStoredAnswers() {
  if (typeof window === "undefined") {
    return {};
  }

  const rawAnswers = window.sessionStorage.getItem(SURVEY_ANSWERS_STORAGE_KEY);

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

function writeStoredAnswers(answers: SurveyAnswers) {
  if (typeof window === "undefined") {
    return;
  }

  if (Object.keys(answers).length === 0) {
    window.sessionStorage.removeItem(SURVEY_ANSWERS_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(SURVEY_ANSWERS_STORAGE_KEY, JSON.stringify(answers));
}

function markPendingResults(submittedAt: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    PENDING_RESULTS_STORAGE_KEY,
    submittedAt ?? new Date().toISOString(),
  );
}

function hasPendingResults() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.sessionStorage.getItem(PENDING_RESULTS_STORAGE_KEY));
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
    "inline-flex h-8 items-center justify-center rounded-[0.9rem] border border-[var(--line)] bg-[var(--keycap-bg)] px-2.5 font-mono text-[11px] font-semibold text-[var(--ink)] shadow-[var(--keycap-shadow)]",
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
        "inline-flex h-8 items-center justify-center rounded-[0.9rem] border border-[var(--line)] bg-[var(--keycap-bg)] px-2.5 font-mono text-[11px] font-semibold text-[var(--ink)] shadow-[var(--keycap-shadow)]",
        wide ? "min-w-[3.3rem]" : "min-w-[2.2rem]",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function SurveyShell({ questions, initialDraft }: SurveyShellProps) {
  const { getToken } = useAuth({ treatPendingAsSignedOut: false });
  const [answers, setAnswers] = useState<SurveyAnswers>(initialDraft?.answers ?? {});
  const [activeIndex, setActiveIndex] = useState(() =>
    findFirstUnansweredIndex(questions, initialDraft?.answers ?? {}),
  );
  const [isHydratingDraft, setIsHydratingDraft] = useState(!initialDraft);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialDraft?.updatedAt ?? null);
  const [pendingSaveCount, setPendingSaveCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const pendingSaveIds = useRef(new Set<string>());
  const pendingTimers = useRef<Map<string, number>>(new Map());
  const getTokenRef = useRef(getToken);
  const deferredAnswers = useDeferredValue(answers);

  const answeredCount = Object.keys(answers).length;
  const completion = Math.round((answeredCount / questions.length) * 100);
  const firstUnansweredIndex = questions.findIndex((question) => !answers[question.id]);
  const hasUnansweredQuestions = firstUnansweredIndex !== -1;
  const currentQuestion = questions[activeIndex];
  const currentAnswer = answers[currentQuestion.id];

  const saveStatus = describeSaveState(pendingSaveCount, lastSavedAt, saveError);
  const authorizedFetch = useCallback(async (input: string, init?: RequestInit) => {
    const token = await getTokenRef.current().catch(() => null);
    const headers = new Headers(init?.headers);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(input, {
      ...init,
      headers,
      credentials: "include",
    });
  }, []);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    writeStoredAnswers(answers);
  }, [answers]);

  const syncDraft = useCallback(async () => {
    try {
      if (hasPendingResults()) {
        navigateWithReload(SURVEY_RESULTS_ROUTE);
        return;
      }

      setIsHydratingDraft(true);
      const response = await authorizedFetch("/api/survey/draft", {
        cache: "no-store",
      });
      const payload = (await response.json()) as { draft?: SurveyDraft; error?: string };

      if (!response.ok || !payload.draft) {
        throw new Error(payload.error ?? "Unable to restore your draft.");
      }

      const storedAnswers = readStoredAnswers();
      const nextAnswers =
        Object.keys(storedAnswers).length > Object.keys(payload.draft.answers).length
          ? storedAnswers
          : payload.draft.answers;

      setAnswers(nextAnswers);
      setLastSavedAt(payload.draft.updatedAt);
      setActiveIndex(findFirstUnansweredIndex(questions, nextAnswers));
      setSaveError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to restore your draft.";
      setSaveError(message);
    } finally {
      setIsHydratingDraft(false);
    }
  }, [authorizedFetch, questions]);

  const persistAnswer = useCallback(
    async (questionId: string, questionOrder: number, value: LikertValue) => {
      try {
        const response = await authorizedFetch("/api/survey/answer", {
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
    [authorizedFetch],
  );

  useEffect(() => {
    if (hasPendingResults()) {
      navigateWithReload(SURVEY_RESULTS_ROUTE);
      return;
    }

    if (!initialDraft) {
      void syncDraft();
    }

    const timerMap = pendingTimers.current;

    return () => {
      timerMap.forEach((timerId) => window.clearTimeout(timerId));
      timerMap.clear();
    };
  }, [initialDraft, syncDraft]);

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

      if (isHydratingDraft || isSubmitting) {
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
    isHydratingDraft,
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
      const response = await authorizedFetch("/api/survey/submit", {
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

      markPendingResults(payload.submission.submittedAt ?? null);
      navigateWithReload(SURVEY_RESULTS_ROUTE);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit your survey.";
      setSaveError(message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  }

  return (
    <>
      <div className="grid gap-4 lg:h-[calc(100svh-2rem)] lg:grid-rows-[auto_minmax(0,1fr)]">
        <SiteTopNav
          breadcrumbTitle="Measures of Your Personality"
          saveStatus={saveStatus}
          saveStatusIsError={Boolean(saveError)}
          helpOnClick={() => setIsHelpOpen(true)}
          helpExpanded={isHelpOpen}
          action={
            <button
              type="button"
              onClick={handleSubmit}
              disabled={answeredCount !== questions.length || isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--accent-sand)] px-5 text-sm font-semibold text-[var(--selected-contrast)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "Submitting..." : "Submit survey"}
            </button>
          }
        />

        <div className="grid min-h-0 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="min-h-0 lg:h-full">
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] backdrop-blur">
              <div className="shrink-0 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                    Survey progress
                  </p>
                  <button
                    type="button"
                    onClick={goToFirstUnansweredQuestion}
                    disabled={!hasUnansweredQuestions || isHydratingDraft || isSubmitting}
                    className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface-panel-strong)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-panel)] disabled:cursor-not-allowed disabled:opacity-40"
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
                  <p className="rounded-full bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-[var(--selected-contrast)]">
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
            <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[2.2rem] border border-[var(--line)] bg-[var(--surface-panel)] shadow-[var(--shadow-strong)] backdrop-blur">
              <div className="border-b border-[var(--line)] px-6 py-4 sm:px-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                    Question {currentQuestion.order} of {questions.length}
                  </p>
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
                <h1 className="mt-2 font-display text-[2rem] leading-tight text-[var(--ink)] sm:text-[2.4rem]">
                  {currentQuestion.prompt}
                </h1>
              </div>

              <div className="min-h-0 flex-1 px-6 py-5 sm:px-7">
                {isHydratingDraft ? (
                  <div className="rounded-[1.8rem] border border-dashed border-[var(--line-strong)] px-6 py-8 text-sm text-[var(--ink-soft)]">
                    Restoring your saved draft...
                  </div>
                ) : currentAnswer ? (
                  <div className="flex h-full min-h-0 flex-col gap-4">
                    <LikertScale
                      labels={currentQuestion.labels}
                      selectedValue={currentAnswer}
                      onSelect={handleSelectAnswer}
                      variant="compact"
                    />

                    <div className="min-h-0 flex-1 motion-safe:animate-[fadeIn_380ms_ease-out]">
                      <ViolinPlot
                        distribution={currentQuestion.seededDistribution}
                        labels={currentQuestion.labels}
                        selectedValue={currentAnswer}
                        className="h-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full">
                    <LikertScale
                      labels={currentQuestion.labels}
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
            className="w-full max-w-xl rounded-[2rem] border border-[var(--line)] bg-[var(--surface-panel-strong)] p-6 shadow-[var(--shadow-strong)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Documentation
                </p>
                <h2 className="mt-2 font-display text-4xl text-[var(--ink)]">Survey help</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-panel)] px-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-panel-strong)]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm leading-7 text-[var(--ink-soft)]">
              <p>
                Answer each statement on the 1 to 6 scale. Your responses autosave to the signed-in
                account as you move through the survey, and each answered item reveals a seeded violin
                plot for that prompt.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.4rem] bg-[var(--accent-lilac)] p-4 text-[var(--selected-contrast)]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    <ShortcutKey wide>1-6</ShortcutKey>
                    <span>Answer</span>
                  </div>
                </div>
                <div className="rounded-[1.4rem] bg-[var(--accent-mint)] p-4 text-[var(--selected-contrast)]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    <ShortcutKey>
                      <ArrowLeftIcon />
                    </ShortcutKey>
                    <span>Previous</span>
                  </div>
                </div>
                <div className="rounded-[1.4rem] bg-[var(--accent-lime)] p-4 text-[var(--selected-contrast)]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    <ShortcutKey>
                      <ArrowRightIcon />
                    </ShortcutKey>
                    <span>Next</span>
                  </div>
                </div>
              </div>
              <p>
                Need the source reference? The AMBI survey flow in this MVP is based on Tal Yarkoni&apos;s
                2010 paper.
              </p>
              <a
                href={DOCUMENTATION_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-[var(--selected-contrast)] transition hover:brightness-105"
              >
                Open documentation
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
