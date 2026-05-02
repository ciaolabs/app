import { redirect } from "next/navigation";

import { SURVEYS_ROUTE } from "@/lib/survey/routes";

export default function SurveyPage() {
  redirect(SURVEYS_ROUTE);
}
