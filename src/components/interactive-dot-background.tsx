"use client";

import { useEffect, useRef } from "react";

export function InteractiveDotBackground() {
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const latestPointRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!backgroundRef.current) {
      return;
    }

    const backgroundElement = backgroundRef.current;

    function paintPointer() {
      animationFrameRef.current = null;
      backgroundElement.style.setProperty("--dot-pointer-x", `${latestPointRef.current.x}px`);
      backgroundElement.style.setProperty("--dot-pointer-y", `${latestPointRef.current.y}px`);
    }

    function handlePointerMove(event: PointerEvent) {
      latestPointRef.current = { x: event.clientX, y: event.clientY };
      backgroundElement.dataset.pointer = "active";

      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(paintPointer);
      }
    }

    function handlePointerLeave() {
      delete backgroundElement.dataset.pointer;
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return <div ref={backgroundRef} aria-hidden="true" className="interactive-dot-background" />;
}
