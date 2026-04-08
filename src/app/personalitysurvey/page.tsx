import { ProtectedRoute } from "@/components/auth/protected-route";
import { SurveyShell } from "@/components/survey/survey-shell";
import { surveyQuestions } from "@/lib/survey/questions";

export const dynamic = "force-dynamic";

export default function PersonalitySurveyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-6 py-4 sm:px-10 lg:px-12">
      <ProtectedRoute>
        <SurveyShell questions={surveyQuestions} initialDraft={null} />
      </ProtectedRoute>
    </main>
  );
}
