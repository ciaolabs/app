import { SurveyLoadingFallback } from "@/app/surveys/loading-ui";

export default function PersonalitySurveyLoading() {
  return (
    <SurveyLoadingFallback
      title="Preparing your personality survey"
      description="We are opening your latest draft and setting up the response workspace."
      variant="survey"
    />
  );
}
