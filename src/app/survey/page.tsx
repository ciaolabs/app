import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SurveyPage() {
  redirect("/personalitysurvey");
}
