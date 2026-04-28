import Image from "next/image";

import { formatSubmittedAt } from "@/lib/date-format";

type DashboardPrintHeaderProps = {
  surveyTitle: string;
  resultsTitle: string;
  submittedAt: string;
  answerCount: number;
};

export function DashboardPrintHeader({
  surveyTitle,
  resultsTitle,
  submittedAt,
  answerCount,
}: DashboardPrintHeaderProps) {
  return (
    <div data-print-only className="dashboard-print-header">
      <div className="dashboard-print-header__brand">
        <Image
          src="/ciao-icon.png"
          alt="Ciao!"
          width={48}
          height={48}
          className="dashboard-print-header__logo"
        />
        <div>
          <p className="dashboard-print-header__brand-mark">Ciao!</p>
          <p className="dashboard-print-header__brand-tag">
            Personality and Beliefs Survey
          </p>
        </div>
      </div>
      <div className="dashboard-print-header__meta">
        <p className="dashboard-print-header__eyebrow">{surveyTitle}</p>
        <h1 className="dashboard-print-header__title">{resultsTitle}</h1>
        <p className="dashboard-print-header__sub">
          Submitted {formatSubmittedAt(submittedAt)} &middot; {answerCount} scored responses
        </p>
      </div>
    </div>
  );
}
