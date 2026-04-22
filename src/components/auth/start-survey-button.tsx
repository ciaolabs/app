"use client";

import { type MouseEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const didPointerNavigate = useRef(false);

  const prefetchSurveyRoute = useCallback(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    router.prefetch(SURVEY_ROUTE);
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    prefetchSurveyRoute();
  }, [prefetchSurveyRoute]);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail > 0 && didPointerNavigate.current) {
      didPointerNavigate.current = false;
      return;
    }

    if (!isSignedIn) {
      router.push("/#auth-panel");
      return;
    }

    setIsNavigating(true);
    router.push(SURVEY_ROUTE);
  }

  function handleMouseDown() {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    didPointerNavigate.current = true;
    setIsNavigating(true);
    router.push(SURVEY_ROUTE);
  }

  return (
    <button
      type="button"
      onClick={(event) => void handleClick(event)}
      onMouseDown={handleMouseDown}
      onPointerEnter={prefetchSurveyRoute}
      onFocus={prefetchSurveyRoute}
      disabled={!isLoaded || !isSignedIn || isNavigating}
      className={className}
    >
      {isNavigating ? pendingLabel : children}
    </button>
  );
}
