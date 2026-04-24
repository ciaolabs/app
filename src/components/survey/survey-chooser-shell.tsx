"use client";

import { useCallback, useState } from "react";

import { navigateWithReload } from "@/lib/browser-navigation";
import { type ActiveSurveyDefinition, type SurveyDefinition } from "@/lib/survey/definitions";
import { type SurveyType, type SurveyUserStatus } from "@/lib/survey/types";

type SurveyChooserShellProps = {
  surveys: SurveyDefinition[];
  initialStatuses: Record<SurveyType, SurveyUserStatus>;
};

function formatSubmissionDate(timestamp: string | null) {
  if (!timestamp) {
    return "No submissions yet";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
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
    "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--selected-contrast)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50";

  if (label === "Continue final attempt" || label === "View details") {
    return `${baseClassName} bg-[var(--accent-blue)]`;
  }

  return `${baseClassName} bg-[var(--accent-coral)]`;
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
        className="mt-4 rounded-[2.6rem] border border-[var(--line)] px-6 py-8 shadow-[var(--shadow-strong)] sm:px-8 sm:py-10"
        style={{ background: "var(--hero-gradient)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
          Survey selection
        </p>
        <h1 className="mt-4 font-display text-5xl text-[var(--ink)] sm:text-6xl">
          Choose which survey you want to take next.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--ink-soft)]">
          Each survey keeps its own draft, saved submissions, and attempt limit. Repeat actions stay
          available only until the final allowed submission is used.
        </p>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
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
              className="relative overflow-hidden rounded-[2.2rem] border border-[var(--line)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                    {buildUsageLabel(survey, status)}
                  </p>
                  <h2 className="mt-3 font-display text-3xl text-[var(--ink)]">{survey.title}</h2>
                </div>
                <span className="rounded-full bg-[var(--surface-panel-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink)]">
                  {buildSurveyBadge(survey, status)}
                </span>
              </div>

              <p className="mt-4 text-base leading-8 text-[var(--ink-soft)]">{survey.description}</p>

              <div className="mt-6 rounded-[1.6rem] border border-[var(--line)] bg-[var(--surface-panel-strong)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Latest submission
                </p>
                <p className="mt-2 text-base text-[var(--ink)]">
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
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-panel-strong)] px-5 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink)] transition hover:border-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Repeat
                  </button>
                ) : null}

                {showReviewAction && reviewHref ? (
                  <button
                    type="button"
                    onClick={() => handleNavigate(reviewHref)}
                    disabled={navigatingPath !== null}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-panel-strong)] px-5 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink)] transition hover:border-[var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-50"
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
            className="w-full max-w-xl rounded-[2rem] border border-[var(--line)] bg-[var(--surface-panel-strong)] p-6 shadow-[var(--shadow-strong)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Final attempt
            </p>
            <h2 className="mt-3 font-display text-4xl text-[var(--ink)]">
              This repeat will be your last chance to complete {repeatSurvey.title}.
            </h2>
            <p className="mt-4 text-base leading-8 text-[var(--ink-soft)]">
              If you continue, the next submission you make for this survey will use your final
              available attempt. You can still review your saved results afterward.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleConfirmRepeat}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--accent-coral)] px-5 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--selected-contrast)] transition hover:brightness-105"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setRepeatSurvey(null)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-panel)] px-5 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink)] transition hover:border-[var(--line-strong)]"
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
