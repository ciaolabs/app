export const dynamic = "force-dynamic";

import { ValuesBeliefsDashboardShell } from "@/components/dashboard/values-beliefs-dashboard-shell";
import { valuesBeliefsSurveyDefinition } from "@/lib/survey/definitions";
import { getInitialDashboardPayload } from "@/lib/survey/server";
import {
  type ResultsPayload,
  type ValuesBeliefsResults,
} from "@/lib/survey/results/types";

export default async function ValuesBeliefsSurveyDashboardPage() {
  const initialPayload = (await getInitialDashboardPayload(
    valuesBeliefsSurveyDefinition.type,
  )) as ResultsPayload<ValuesBeliefsResults>;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-6 pt-0 pb-16 sm:px-10 lg:px-12">
      <ValuesBeliefsDashboardShell
        survey={valuesBeliefsSurveyDefinition}
        initialPayload={initialPayload}
      />
    </main>
  );
}
