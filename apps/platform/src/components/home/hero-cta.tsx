"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";

import { StartSurveyButton } from "@/components/auth/start-survey-button";

const SIGN_IN_ROUTE = "/sign-in";

const CTA_CLASS_NAME =
  "clay-button-hover inline-flex h-12 items-center gap-2 rounded-full border border-black bg-(--accent-blue) px-6 text-sm font-semibold text-(--selected-contrast) shadow-(--shadow-soft)";

/**
 * Hero call-to-action on the static landing page. The session resolves
 * client-side, so the signed-out link renders first and swaps to the survey
 * button once AuthKit reports a user.
 */
export function HeroCta() {
  const { user } = useAuth();

  if (user) {
    return <StartSurveyButton className={CTA_CLASS_NAME}>Start a survey →</StartSurveyButton>;
  }

  return (
    <a href={SIGN_IN_ROUTE} className={CTA_CLASS_NAME}>
      Sign in to start →
    </a>
  );
}
