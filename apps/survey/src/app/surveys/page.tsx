export const dynamic = "force-dynamic";

import { Suspense, cache } from "react";

import { SurveyChooserLoadingContent } from "@/app/surveys/loading-ui";
import { SurveyChooserContent } from "@/app/surveys/survey-page-content";
import { SiteTopNav } from "@/components/site-top-nav";
import { surveyDefinitions } from "@/lib/survey/definitions";
import { getInitialSurveyStatuses } from "@/lib/survey/server";

const getSurveysPageInitialStatuses = cache(() =>
  getInitialSurveyStatuses(surveyDefinitions),
);

export default function SurveysPage() {
  const initialStatusesPromise = getSurveysPageInitialStatuses();

  return (
    <>
      <style>{`@media (min-width: 1024px) { html, body { height: 100vh; overflow: hidden; } .app-shell { min-height: 0; height: calc(100vh - 2rem); overflow: hidden; } }`}</style>
      <main className="mx-auto min-h-screen w-full max-w-[1440px] px-6 pt-0 pb-16 sm:px-10 lg:h-screen lg:overflow-hidden lg:px-12 lg:pb-0">
        <SiteTopNav breadcrumbTitle="Surveys" action={null} />
        <Suspense
          fallback={(
            <SurveyChooserLoadingContent
              title="Preparing your surveys"
              description="We are loading your saved drafts, submissions, and available attempts."
            />
          )}
        >
          <SurveyChooserContent initialStatusesPromise={initialStatusesPromise} />
        </Suspense>
      </main>
    </>
  );
}
