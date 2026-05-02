import { SurveyLoadingFallback } from "@/app/surveys/loading-ui";

export default function SurveysLoading() {
  return (
    <SurveyLoadingFallback
      title="Preparing your surveys"
      description="We are loading your saved drafts, submissions, and available attempts."
    />
  );
}
