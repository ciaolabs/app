"use client";

import { type ReactNode, useState } from "react";
import { useAuth } from "@clerk/nextjs";

import { navigateWithReload } from "@/lib/browser-navigation";
import { SURVEY_ROUTE } from "@/lib/survey/routes";

type StartSurveyButtonProps = {
  children: ReactNode;
  className: string;
  pendingLabel?: string;
};

export function StartSurveyButton({
  children,
  className,
  pendingLabel = "Opening survey...",
}: StartSurveyButtonProps) {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const [isNavigating, setIsNavigating] = useState(false);

  async function handleClick() {
    if (!isSignedIn) {
      navigateWithReload("/#auth-panel");
      return;
    }

    setIsNavigating(true);
    navigateWithReload(SURVEY_ROUTE);
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={!isLoaded || !isSignedIn || isNavigating}
      className={className}
    >
      {isNavigating ? pendingLabel : children}
    </button>
  );
}
