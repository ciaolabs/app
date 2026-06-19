"use client";

import { type MouseEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { routes } from "@/lib/routes";

type StartSurveyButtonProps = {
  children: ReactNode;
  className: string;
  href?: string;
  pendingLabel?: string;
};

export function StartSurveyButton({
  children,
  className,
  href = routes.surveys,
  pendingLabel = "Opening",
}: StartSurveyButtonProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const didPointerNavigate = useRef(false);

  const prefetchSurveyRoute = useCallback(() => {
    router.prefetch(href);
  }, [href, router]);

  useEffect(() => {
    prefetchSurveyRoute();
  }, [prefetchSurveyRoute]);

  const startNavigation = useCallback(() => {
    if (isNavigating) {
      return;
    }

    setIsNavigating(true);
    router.push(href);
  }, [href, isNavigating, router]);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail > 0 && didPointerNavigate.current) {
      didPointerNavigate.current = false;
      return;
    }

    startNavigation();
  }

  function handleMouseDown() {
    didPointerNavigate.current = true;
    startNavigation();
  }

  return (
    <button
      type="button"
      onClick={(event) => void handleClick(event)}
      onMouseDown={handleMouseDown}
      onPointerEnter={prefetchSurveyRoute}
      onFocus={prefetchSurveyRoute}
      disabled={isNavigating}
      aria-busy={isNavigating}
      aria-label={isNavigating ? `${pendingLabel}...` : undefined}
      className={className}
    >
      <span className="inline-flex min-w-24 items-center justify-center sm:min-w-36">
        {isNavigating ? (
          <>
            <span>{pendingLabel}</span>
            <span className="opening-dots" aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
