import { SurveyChooserShell } from "@/components/survey/survey-chooser-shell";
import { SiteTopNav } from "@/components/site-top-nav";
import { surveyDefinitions } from "@/lib/survey/definitions";
import { getInitialSurveyStatuses } from "@/lib/survey/server";

export default async function SurveysPage() {
  const initialStatuses = await getInitialSurveyStatuses(surveyDefinitions);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-6 pt-0 pb-16 sm:px-10 lg:px-12">
      <SiteTopNav breadcrumbTitle="Surveys" action={null} />
      <SurveyChooserShell surveys={surveyDefinitions} initialStatuses={initialStatuses} />
    </main>
  );
}
