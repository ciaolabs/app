"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { formatSubmittedAt } from "@/lib/date-format";
import {
  getPendingResultsKey,
  type ActiveSurveyDefinition,
  type SurveyDefinition,
} from "@/lib/survey/definitions";
import { type SurveyType, type SurveyUserStatus } from "@/lib/survey/types";

type SurveyChooserShellProps = {
  surveys: SurveyDefinition[];
  initialStatuses: Record<SurveyType, SurveyUserStatus>;
};

function formatSubmissionDate(timestamp: string | null) {
  return timestamp ? formatSubmittedAt(timestamp) : "No submissions yet";
}

function buildUsageLabel(survey: SurveyDefinition, status: SurveyUserStatus | null) {
  if (survey.availability === "coming-soon") {
    return "Coming soon";
  }

  if (!status) {
    return "Loading availability";
  }

  return `${status.submittedCount} of ${survey.maxSubmissions} submissions used`;
}

function buildSurveyBadge(survey: SurveyDefinition, status: SurveyUserStatus | null) {
  if (survey.availability === "coming-soon") {
    return "Coming soon";
  }

  if (!status) {
    return "Checking status";
  }

  if (status.submittedCount >= (survey.maxSubmissions ?? Number.MAX_SAFE_INTEGER)) {
    return "All attempts used";
  }

  if (status.submittedCount === 1) {
    return "Last available attempt";
  }

  if (
    status.submittedCount === 0 &&
    status.hasActiveDraft &&
    status.activeDraftAnswerCount > 0
  ) {
    return "Draft in progress";
  }

  return "Ready to start";
}

type ButtonIntent = "primary" | "secondary" | "danger";

type SurveyAction = {
  label: string;
  href: string;
  intent: ButtonIntent;
  disabled: boolean;
};

function buildPrimaryAction(
  survey: SurveyDefinition,
  status: SurveyUserStatus | null,
): SurveyAction {
  if (survey.availability === "coming-soon") {
    return {
      label: "Start survey →",
      href: survey.route,
      intent: "primary",
      disabled: false,
    };
  }

  if (!status) {
    return {
      label: "Loading...",
      href: survey.route,
      intent: "secondary",
      disabled: true,
    };
  }

  if (status.submittedCount >= (survey.maxSubmissions ?? Number.MAX_SAFE_INTEGER)) {
    return {
      label: "Review results →",
      href: survey.dashboardRoute,
      intent: "primary",
      disabled: false,
    };
  }

  if (status.submittedCount === 1) {
    return {
      label: "Repeat survey",
      href: survey.route,
      intent: "danger",
      disabled: false,
    };
  }

  if (status.hasActiveDraft && status.activeDraftAnswerCount > 0) {
    return {
      label: "Continue survey →",
      href: survey.route,
      intent: "primary",
      disabled: false,
    };
  }

  return {
    label: "Start survey →",
    href: survey.route,
    intent: "primary",
    disabled: false,
  };
}

function buttonClassName(intent: ButtonIntent) {
  const baseClassName =
    "clay-button-hover inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold shadow-(--shadow-soft) disabled:cursor-not-allowed disabled:opacity-50";

  if (intent === "primary") {
    return `${baseClassName} border border-black bg-(--accent-blue) text-(--selected-contrast)`;
  }

  if (intent === "danger") {
    return `${baseClassName} border border-(--accent-coral) bg-(--surface-panel-strong) text-(--accent-coral)`;
  }

  return `${baseClassName} border border-(--line-strong) bg-(--surface-panel-strong) text-(--ink)`;
}

function RepeatIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d="M5.5 5.5h7.25A3.75 3.75 0 0 1 16.5 9.25v.25M5.5 5.5 8 3M5.5 5.5 8 8M14.5 14.5H7.25A3.75 3.75 0 0 1 3.5 10.75v-.25M14.5 14.5 12 12M14.5 14.5 12 17"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.55"
      />
    </svg>
  );
}

function shouldOfferRepeatAction(survey: SurveyDefinition, status: SurveyUserStatus | null): survey is ActiveSurveyDefinition {
  return (
    survey.availability === "active" &&
    status !== null &&
    status.submittedCount === 1
  );
}

export function SurveyChooserShell({ surveys, initialStatuses }: SurveyChooserShellProps) {
  const router = useRouter();
  const [navigatingPath, setNavigatingPath] = useState<string | null>(null);
  const [repeatSurvey, setRepeatSurvey] = useState<ActiveSurveyDefinition | null>(null);
  const prefetchPaths = useMemo(
    () =>
      Array.from(
        new Set(
          surveys.flatMap((survey) => {
            if (survey.availability !== "active") {
              return [survey.route];
            }

            const status = initialStatuses[survey.type] ?? null;
            const paths = [survey.route];

            if ((status?.submittedCount ?? 0) > 0) {
              paths.push(survey.dashboardRoute);
            }

            return paths;
          }),
        ),
      ),
    [initialStatuses, surveys],
  );

  const prefetchPath = useCallback(
    (path: string | null) => {
      if (!path) {
        return;
      }

      router.prefetch(path);
    },
    [router],
  );

  useEffect(() => {
    prefetchPaths.forEach(prefetchPath);
  }, [prefetchPath, prefetchPaths]);

  const handleNavigate = useCallback((path: string) => {
    setNavigatingPath(path);
    router.push(path);
  }, [router]);

  const handleConfirmRepeat = useCallback(() => {
    if (!repeatSurvey) {
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(getPendingResultsKey(repeatSurvey.type));
    }

    setRepeatSurvey(null);
    handleNavigate(repeatSurvey.route);
  }, [handleNavigate, repeatSurvey]);

  return (
    <>
      <section
        className="clay-section relative mt-6 overflow-hidden rounded-3xl border border-(--line-strong) px-6 py-8 sm:px-8 sm:py-10"
        style={{ background: "var(--hero-gradient)" }}
      >
        <div className="hero-blob hero-blob-1" aria-hidden="true" />
        <div className="hero-blob hero-blob-2" aria-hidden="true" />
        <div className="hero-blob hero-blob-3" aria-hidden="true" />
        <div className="hero-blob hero-blob-4" aria-hidden="true" />

        <div className="relative">
          <p className="clay-label">
            Survey selection
          </p>
        <h1 className="mt-4 font-display text-5xl text-(--ink) sm:text-6xl">
          Choose which survey you want to take next.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-(--ink-soft)">
          Each survey keeps its own draft, saved submissions, and attempt limit. Repeat actions stay
          available only until the final allowed submission is used.
        </p>
        </div>
      </section>

      <section className="mt-4 grid gap-6 lg:grid-cols-2">
        {surveys.map((survey) => {
          const status = initialStatuses[survey.type] ?? null;
          const primaryAction = buildPrimaryAction(survey, status);
          const showRepeatAction = shouldOfferRepeatAction(survey, status);
          const repeatActionSurvey = showRepeatAction ? survey : null;
          const hasSingleSubmission = status?.submittedCount === 1;
          const reviewHref = survey.availability === "active" ? survey.dashboardRoute : null;
          const showReviewAction = survey.availability === "active" && hasSingleSubmission;

          return (
            <article
              key={survey.type}
              className="relative overflow-hidden rounded-3xl border border-(--line) bg-(--surface-panel) p-6 shadow-(--shadow-soft)"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="clay-label">
                    {buildUsageLabel(survey, status)}
                  </p>
                  <h2 className="mt-3 font-display text-3xl text-(--ink)">{survey.title}</h2>
                </div>
                <span className="rounded-full border border-dashed border-(--line) bg-(--surface-panel-strong) px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-(--ink)">
                  {buildSurveyBadge(survey, status)}
                </span>
              </div>

              <p className="mt-4 text-base leading-8 text-(--ink-soft)">{survey.description}</p>

              <div className="mt-6 rounded-2xl border border-dashed border-(--line) bg-(--surface-panel-strong) p-4">
                <p className="clay-label">
                  Latest submission
                </p>
                <p className="mt-2 text-base text-(--ink)">
                  {formatSubmissionDate(status?.latestSubmissionAt ?? null)}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {showReviewAction && reviewHref ? (
                  <button
                    type="button"
                    onClick={() => handleNavigate(reviewHref)}
                    onPointerEnter={() => prefetchPath(reviewHref)}
                    onFocus={() => prefetchPath(reviewHref)}
                    disabled={navigatingPath !== null}
                    className={buttonClassName("primary")}
                    style={{ backgroundColor: "#C1B0FF" }}
                  >
                    Review results →
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    if (repeatActionSurvey) {
                      setRepeatSurvey(repeatActionSurvey);
                      return;
                    }

                    handleNavigate(primaryAction.href);
                  }}
                  onPointerEnter={() => prefetchPath(primaryAction.href)}
                  onFocus={() => prefetchPath(primaryAction.href)}
                  disabled={primaryAction.disabled || navigatingPath !== null}
                  className={buttonClassName(primaryAction.intent)}
                >
                  {navigatingPath === primaryAction.href ? (
                    "Opening..."
                  ) : (
                    <>
                      {primaryAction.label === "Repeat survey" ? <RepeatIcon /> : null}
                      {primaryAction.label}
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {repeatSurvey ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5 py-8 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-xl rounded-3xl border border-(--line-strong) bg-(--surface-panel-strong) p-6 shadow-(--shadow-strong)"
          >
            <p className="clay-label">
              Second attempt
            </p>
            <h2 className="mt-3 font-display text-4xl text-(--ink)">
              This repeat will be your second attempt at {repeatSurvey.title}.
            </h2>
            <p className="mt-4 text-base leading-8 text-(--ink-soft)">
              If you continue, the next submission you make for this survey will be your second
              attempt. You can still review your saved results afterward.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleConfirmRepeat}
                className={buttonClassName("primary")}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setRepeatSurvey(null)}
                className={buttonClassName("secondary")}
              >
                No
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
