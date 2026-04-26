import { SurveyShell } from "@/components/survey/survey-shell";
import { personalitySurveyDefinition } from "@/lib/survey/definitions";
import { getRequiredSurveyDraft } from "@/lib/survey/server";

export default async function PersonalitySurveyPage() {
  const initialDraft = await getRequiredSurveyDraft(personalitySurveyDefinition.type);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-6 pt-4 pb-16 sm:px-10 sm:pt-6 lg:px-12">
      <SurveyShell
        survey={personalitySurveyDefinition}
        questions={[...personalitySurveyDefinition.questions]}
        initialDraft={initialDraft}
      />
    </main>
  );
}
