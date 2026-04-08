import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

export default function PersonalitySurveyDashboardPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1200px] px-6 py-4 sm:px-10">
      <ProtectedRoute
        loadingTitle="Preparing your dashboard"
        loadingBody="We are checking your account and loading the latest saved submission."
        redirectingTitle="Returning to sign in"
        redirectingBody="Your dashboard needs an active account session, so we are sending you back to the sign-in panel."
      >
        <DashboardShell />
      </ProtectedRoute>
    </main>
  );
}
