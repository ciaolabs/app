
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { personalitySurveyDefinition } from "@/lib/survey/definitions";
import { getInitialDashboardPayload } from "@/lib/survey/server";
import { type ResultsPayload, type SurveyResults } from "@/lib/survey/results/types";

export default async function PersonalitySurveyDashboardPage() {
  const initialPayload = (await getInitialDashboardPayload(
    personalitySurveyDefinition.type,
  )) as ResultsPayload<SurveyResults>;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-6 pt-0 pb-16 sm:px-10 lg:px-12">
      <DashboardShell survey={personalitySurveyDefinition} initialPayload={initialPayload} />
    </main>
  );
}
