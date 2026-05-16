export const dynamic = "force-dynamic";

import { SurveyShell } from "@/components/survey/survey-shell";
import { personalitySurveyDefinition } from "@/lib/survey/definitions";
import { getRequiredSurveyDraft } from "@/lib/survey/server";

export default async function PersonalitySurveyPage() {
  const initialDraft = await getRequiredSurveyDraft(personalitySurveyDefinition.type);

  return (
    <>
      <style>{`@media (min-width: 1024px) { html, body, .app-shell { height: 100vh; overflow: hidden; } }`}</style>
      <main className="mx-auto min-h-screen w-full max-w-[1440px] px-6 pt-0 pb-16 sm:px-10 lg:h-screen lg:overflow-hidden lg:px-12 lg:pb-0">
        <SurveyShell
          survey={personalitySurveyDefinition}
          questions={personalitySurveyDefinition.questions}
          initialDraft={initialDraft}
        />
      </main>
    </>
  );
}
