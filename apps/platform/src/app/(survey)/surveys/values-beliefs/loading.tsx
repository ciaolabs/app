import { SurveyLoadingFallback } from "@/app/(survey)/surveys/loading-ui";

export default function ValuesBeliefsSurveyLoading() {
  return (
    <SurveyLoadingFallback
      title="Preparing your values and beliefs survey"
      description="We are opening your latest draft and setting up the response workspace."
      variant="survey"
    />
  );
}
