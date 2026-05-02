import { use } from "react";

import { SurveyChooserShell } from "@/components/survey/survey-chooser-shell";
import { surveyDefinitions } from "@/lib/survey/definitions";
import { type SurveyType, type SurveyUserStatus } from "@/lib/survey/types";

type SurveyStatusesByType = Record<SurveyType, SurveyUserStatus>;

export function ResolvedSurveyChooserContent({
  initialStatuses,
}: {
  initialStatuses: SurveyStatusesByType;
}) {
  return <SurveyChooserShell surveys={surveyDefinitions} initialStatuses={initialStatuses} />;
}

export function SurveyChooserContent({
  initialStatusesPromise,
}: {
  initialStatusesPromise: Promise<SurveyStatusesByType>;
}) {
  const initialStatuses = use(initialStatusesPromise);

  return <ResolvedSurveyChooserContent initialStatuses={initialStatuses} />;
}
