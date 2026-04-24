import { redirect } from "next/navigation";

import { personalitySurveyDefinition } from "@/lib/survey/definitions";

export default function DashboardRedirectPage() {
  redirect(personalitySurveyDefinition.dashboardRoute);
}
