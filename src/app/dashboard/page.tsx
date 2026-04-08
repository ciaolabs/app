import { redirect } from "next/navigation";

import { SURVEY_RESULTS_ROUTE } from "@/lib/survey/routes";

export const dynamic = "force-dynamic";

export default function DashboardRedirectPage() {
  redirect(SURVEY_RESULTS_ROUTE);
}
