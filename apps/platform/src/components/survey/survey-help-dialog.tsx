"use client";

import type { SurveyHelpContent } from "@/lib/survey/definitions";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ShortcutKey,
} from "@/components/survey/survey-keycaps";

type SurveyHelpDialogProps = {
  helpContent: SurveyHelpContent | null;
  onClose: () => void;
};

export default function SurveyHelpDialog({ helpContent, onClose }: SurveyHelpDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 px-5 py-8 backdrop-blur-sm sm:items-center">
      <div
        id="survey-help-panel"
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl rounded-[1.5rem] border border-[var(--line-strong)] bg-[var(--surface-panel-strong)] p-6 shadow-[var(--shadow-strong)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="clay-label">Documentation</p>
            <h2 className="mt-2 font-display text-4xl text-[var(--ink)]">Survey help</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="clay-button-hover inline-flex h-11 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-panel)] px-3 text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-soft)]"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-5 text-sm leading-7 text-[var(--ink-soft)]">
          <p>{helpContent?.body}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-black bg-[var(--accent-blue)] p-4 text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                <ShortcutKey wide>1-6</ShortcutKey>
                <span>Answer</span>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-black bg-[var(--accent-blue)] p-4 text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                <ShortcutKey>
                  <ArrowLeftIcon />
                </ShortcutKey>
                <span>Previous</span>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-black bg-[var(--accent-blue)] p-4 text-[var(--selected-contrast)] shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                <ShortcutKey>
                  <ArrowRightIcon />
                </ShortcutKey>
                <span>Next</span>
              </div>
            </div>
          </div>
          {helpContent ? (
            <>
              <p>{helpContent.referencesIntro}</p>
              <div className="flex flex-wrap gap-3">
                {helpContent.references.map((reference) => (
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
  );
}
