"use client";

import { useCallback, useState } from "react";

import { navigateWithReload } from "@/lib/browser-navigation";
import { formatSubmittedAt } from "@/lib/date-format";
import { type ActiveSurveyDefinition, type SurveyDefinition } from "@/lib/survey/definitions";
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

  if (status.submittedCount === 1 && status.hasActiveDraft) {
    return "Final attempt in progress";
  }

  if (status.submittedCount === 1) {
    return "Last available attempt";
  }

  if (status.hasActiveDraft) {
    return "Draft in progress";
  }

  return "Ready to start";
}

function buildPrimaryAction(survey: SurveyDefinition, status: SurveyUserStatus | null) {
  if (survey.availability === "coming-soon") {
    return {
      label: survey.ctaLabel,
      href: survey.route,
      disabled: false,
    };
  }

  if (!status) {
    return {
      label: "Loading...",
      href: survey.route,
      disabled: true,
    };
  }

  if (status.submittedCount >= (survey.maxSubmissions ?? Number.MAX_SAFE_INTEGER)) {
    return {
      label: "Review results",
      href: survey.dashboardRoute,
      disabled: false,
    };
  }

  if (status.submittedCount === 1 && status.hasActiveDraft) {
    return {
      label: "Continue final attempt",
      href: survey.route,
      disabled: false,
    };
  }

  if (status.submittedCount === 1) {
    return {
      label: "Review results",
      href: survey.dashboardRoute,
      disabled: false,
    };
  }

  if (status.hasActiveDraft) {
    return {
      label: "Continue survey",
      href: survey.route,
      disabled: false,
    };
  }

  return {
    label: survey.ctaLabel,
    href: survey.route,
    disabled: false,
  };
}

function primaryActionClassName(label: string) {
  const baseClassName =
    "clay-button-hover inline-flex h-11 items-center justify-center rounded-full border border-black px-5 text-sm font-semibold uppercase tracking-[0.16em] text-(--selected-contrast) shadow-(--shadow-soft) disabled:cursor-not-allowed disabled:opacity-50";

  // Make start / continue actions blue like other primary CTAs
  if (
    label === "Continue final attempt" ||
    label === "View details" ||
    label === "Start survey" ||
    label === "Continue survey" ||
    label === "Start a survey →"
  ) {
    return `${baseClassName} bg-(--accent-blue)`;
  }

  return `${baseClassName} bg-(--accent-coral)`;
}

function shouldOfferRepeatAction(survey: SurveyDefinition, status: SurveyUserStatus | null): survey is ActiveSurveyDefinition {
  return (
    survey.availability === "active" &&
    status !== null &&
    status.submittedCount === 1 &&
    !status.hasActiveDraft
  );
}

export function SurveyChooserShell({ surveys, initialStatuses }: SurveyChooserShellProps) {
  const [navigatingPath, setNavigatingPath] = useState<string | null>(null);
  const [repeatSurvey, setRepeatSurvey] = useState<ActiveSurveyDefinition | null>(null);

  const handleNavigate = useCallback((path: string) => {
    setNavigatingPath(path);
    navigateWithReload(path);
  }, []);

  const handleConfirmRepeat = useCallback(() => {
    if (!repeatSurvey) {
      return;
    }

    setRepeatSurvey(null);
    handleNavigate(repeatSurvey.route);
  }, [handleNavigate, repeatSurvey]);

  return (
    <>
      <section
        className="clay-section mt-6 px-6 py-8 sm:px-8 sm:py-10"
        style={{ background: "var(--hero-gradient)" }}
      >
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
      </section>

      <section className="mt-4 grid gap-6 lg:grid-cols-2">
        {surveys.map((survey) => {
          const status = initialStatuses[survey.type] ?? null;
          const primaryAction = buildPrimaryAction(survey, status);
          const showRepeatAction = shouldOfferRepeatAction(survey, status);
          const repeatActionSurvey = showRepeatAction ? survey : null;
          const hasSingleSubmission = status?.submittedCount === 1;
          const hasDraftInProgress = status?.hasActiveDraft === true;
          const reviewHref = survey.availability === "active" ? survey.dashboardRoute : null;
          const showReviewAction =
            survey.availability === "active" &&
            hasSingleSubmission &&
            hasDraftInProgress;

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
                <button
                  type="button"
                  onClick={() => handleNavigate(primaryAction.href)}
                  disabled={primaryAction.disabled || navigatingPath !== null}
                  className={primaryActionClassName(primaryAction.label)}
                >
                  {navigatingPath === primaryAction.href ? "Opening..." : primaryAction.label}
                </button>

                {repeatActionSurvey ? (
                  <button
                    type="button"
                    onClick={() => setRepeatSurvey(repeatActionSurvey)}
                    disabled={navigatingPath !== null}
                    className="clay-button-hover inline-flex h-11 items-center justify-center rounded-full border border-(--line-strong) bg-(--surface-panel-strong) px-5 text-sm font-semibold uppercase tracking-[0.16em] text-(--ink) shadow-(--shadow-soft) disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Repeat
                  </button>
                ) : null}

                {showReviewAction && reviewHref ? (
                  <button
                    type="button"
                    onClick={() => handleNavigate(reviewHref)}
                    disabled={navigatingPath !== null}
                    className="clay-button-hover inline-flex h-11 items-center justify-center rounded-full border border-(--line-strong) bg-(--surface-panel-strong) px-5 text-sm font-semibold uppercase tracking-[0.16em] text-(--ink) shadow-(--shadow-soft) disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Review results
                  </button>
                ) : null}
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
              Final attempt
            </p>
            <h2 className="mt-3 font-display text-4xl text-(--ink)">
              This repeat will be your last chance to complete {repeatSurvey.title}.
            </h2>
            <p className="mt-4 text-base leading-8 text-(--ink-soft)">
              If you continue, the next submission you make for this survey will use your final
              available attempt. You can still review your saved results afterward.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleConfirmRepeat}
                className="clay-button-hover inline-flex h-11 items-center justify-center rounded-full border border-black bg-(--accent-coral) px-5 text-sm font-semibold uppercase tracking-[0.16em] text-(--selected-contrast) shadow-(--shadow-soft)"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setRepeatSurvey(null)}
                className="clay-button-hover inline-flex h-11 items-center justify-center rounded-full border border-(--line-strong) bg-(--surface-panel) px-5 text-sm font-semibold uppercase tracking-[0.16em] text-(--ink) shadow-(--shadow-soft)"
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
