import { SurveyShell } from "@/components/survey/survey-shell";
import { valuesBeliefsSurveyDefinition } from "@/lib/survey/definitions";
import { getRequiredSurveyDraft } from "@/lib/survey/server";

export default async function ValuesBeliefsSurveyPage() {
  const initialDraft = await getRequiredSurveyDraft(valuesBeliefsSurveyDefinition.type);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-6 pt-0 pb-16 sm:px-10 lg:px-12">
      <SurveyShell
        survey={valuesBeliefsSurveyDefinition}
        questions={valuesBeliefsSurveyDefinition.questions}
        initialDraft={initialDraft}
      />
    </main>
  );
}
