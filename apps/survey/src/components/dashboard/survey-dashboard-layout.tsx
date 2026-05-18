"use client";

import Link from "next/link";
import { type ReactNode } from "react";

import { DashboardPdfButton } from "@/components/dashboard/dashboard-pdf-button";
import { DashboardPrintHeader } from "@/components/dashboard/dashboard-print-header";
import { SiteTopNav } from "@/components/site-top-nav";
import { formatSubmittedAt } from "@/lib/date-format";
import { type ActiveSurveyDefinition } from "@/lib/survey/definitions";
import { SURVEYS_ROUTE } from "@/lib/survey/routes";
import { type SurveySubmissionSummary } from "@/lib/survey/types";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export function describeDashboardError(error: string): string {
  if (/authentication required/i.test(error)) {
    return "Please refresh the page and try again.";
  }

  return error;
}

// ---------------------------------------------------------------------------
// SubmissionHistoryList — identical across all dashboard shells
// ---------------------------------------------------------------------------

type SubmissionHistoryListProps = {
  submissions: SurveySubmissionSummary[];
  selectedSubmissionId: string | null;
  isSwitchingSubmission: boolean;
  selectionError: string | null;
  onSelect: (submissionId: string) => void;
};

export function SubmissionHistoryList({
  submissions,
  selectedSubmissionId,
  isSwitchingSubmission,
  selectionError,
  onSelect,
}: SubmissionHistoryListProps) {
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

// ---------------------------------------------------------------------------
// SurveyDashboardLayout
// ---------------------------------------------------------------------------

type SubmissionInfo = {
  submittedAt: string | null;
  answerCount: number;
  submissionId: string;
};

type SurveyDashboardLayoutProps = {
  /** Survey meta from the active survey definition. */
  survey: Pick<ActiveSurveyDefinition, "type" | "title" | "route" | "resultsTitle">;

  /** Top-level error string (e.g. auth failure, load failure). When set the
   *  error section is rendered instead of the content. */
  error: string | null;

  /** Whether there is any loaded result. When false (and no error) the empty
   *  state is shown. */
  hasResults: boolean;

  /** The currently viewed submission, needed by the hero info card and the
   *  print header. */
  submission: SubmissionInfo | null;

  /** Paragraph(s) placed under the `resultsTitle` heading in the hero section.
   *  Typically 1-2 `<p>` elements specific to the survey type. */
  heroDescription: ReactNode;

  /** Links shown next to the PDF button in the hero info card. */
  heroActionLinks: ReactNode;

  /** @deprecated No longer rendered. */
  submissionHistory?: ReactNode;

  /** Optional content rendered at the bottom of the hero section, below the
   *  two-column grid. Used for e.g. a summary narrative specific to one
   *  survey type. */
  heroFooter?: ReactNode;

  /** The tab strip and all tabbed content beneath the hero section. */
  children: ReactNode;

  /** Body text for the empty state. Defaults to a generic message. */
  emptyStateBody?: string;
};

/**
 * Shared outer scaffold for survey results dashboards.
 *
 * Renders the top nav, error state, empty state, print header, and hero
 * section. Survey-type-specific content (tab strip, tab panels, narrative,
 * etc.) is passed as `children`.
 */
export function SurveyDashboardLayout({
  survey,
  error,
  hasResults,
  submission,
  heroDescription,
  heroActionLinks,
  submissionHistory,
  heroFooter,
  children,
  emptyStateBody = "Your results dashboard appears after you submit the survey.",
}: SurveyDashboardLayoutProps) {
  return (
    <>
      <SiteTopNav
        breadcrumbItems={[
          { label: "Surveys", href: SURVEYS_ROUTE },
          { label: survey.title, href: survey.route },
          { label: "Survey Results" },
        ]}
        action={
          <div className="flex items-center gap-2">
            {submission ? (
              <DashboardPdfButton
                fileName={`Ciao - ${survey.title} - ${formatSubmittedAt(submission.submittedAt)}.pdf`}
              />
            ) : null}
            <Link
              href={SURVEYS_ROUTE}
              className="clay-button-hover inline-flex h-11 items-center justify-center rounded-full border border-black bg-[var(--accent-blue)] px-5 text-sm font-semibold text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]"
            >
              Start a survey →
            </Link>
          </div>
        }
      />

      {error ? (
        <section
          className="hero-sun-surveys clay-section mt-6 px-8 py-10 sm:px-12"
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

      {!error && !hasResults ? (
        <section
          className="hero-sun-surveys clay-section mt-6 px-8 py-10 sm:px-12"
        >
          <p className="clay-label">
            No submission yet
          </p>
          <h1 className="mt-4 font-display text-5xl text-[var(--ink)] sm:text-6xl">
            Your results dashboard appears after you submit the survey.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--ink-soft)]">
            {emptyStateBody}
          </p>
          <Link
            href={SURVEYS_ROUTE}
            className="clay-button-hover mt-8 inline-flex rounded-full border border-black bg-[var(--accent-blue)] px-5 py-3 text-sm font-semibold text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]"
          >
            Start a survey →
          </Link>
        </section>
      ) : null}

      {!error && hasResults && submission ? (
        <div className="mt-6 space-y-6">
          <DashboardPrintHeader
            surveyTitle={survey.title}
            resultsTitle={survey.resultsTitle}
            submittedAt={submission.submittedAt ?? ""}
            answerCount={submission.answerCount}
          />
          <section
            data-print-hide
            className="hero-sun-surveys clay-section overflow-hidden px-5 pb-6 pt-16 sm:px-8 sm:pb-8 sm:pt-20 lg:pt-8 lg:pb-6"
          >
            <div>
              <p className="clay-label">
                Survey Results
              </p>
              <div className="mt-4 flex justify-center">
                <h1
                  className="relative inline-flex items-center text-center rounded-2xl bg-(--surface-panel-strong) px-6 py-3 font-display text-xl text-(--ink) sm:px-8 sm:py-4 sm:text-2xl lg:rounded-3xl lg:px-14 lg:py-6 lg:text-5xl xl:px-16 xl:py-8 xl:text-6xl"
                  style={{
                    boxShadow:
                      "0 12px 24px -10px rgba(20, 15, 10, 0.22), 0 3px 6px -2px rgba(20, 15, 10, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 -2px 4px rgba(20, 15, 10, 0.04)",
                    filter: "drop-shadow(2px 4px 4px rgba(20, 15, 10, 0.10))",
                  }}
                >
                  {survey.resultsTitle}
                  <svg
                    aria-hidden="true"
                    className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 lg:-bottom-[20px] lg:w-[32px] lg:h-[28px] xl:-bottom-[24px] xl:w-[38px] xl:h-[32px]"
                    width="16"
                    height="14"
                    viewBox="0 0 16 14"
                    fill="none"
                  >
                    <path
                      d="M 16 0 L 0 0 Q 4 2 7 8 Q 9 13 10.5 13.5 Q 12 14 12.5 12 Q 13 8 16 1 Z"
                      fill="var(--surface-panel-strong)"
                    />
                  </svg>
                </h1>
              </div>
              <div className="mt-8">
                {heroDescription}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {heroActionLinks}
              </div>
            </div>

            {heroFooter ? (
              <div className="mt-8">
                {heroFooter}
              </div>
            ) : null}
          </section>

          {children}
        </div>
      ) : null}
    </>
  );
}
