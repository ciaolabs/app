import { redirect } from "next/navigation";

import { SURVEY_RESULTS_ROUTE } from "@/lib/survey/routes";

export default function DashboardRedirectPage() {
  redirect(SURVEY_RESULTS_ROUTE);
}
