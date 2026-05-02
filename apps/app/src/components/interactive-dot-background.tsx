"use client";

import { useEffect, useRef } from "react";

const BASE_RADIUS_REM = 6;
const SQUASH_AMOUNT = 0.16;
const STRETCH_REFERENCE_PX = 150;
const STRETCH_GROWTH = 0.09;
const ELLIPSE_SAMPLES = 40;

const SAMPLE_COS = Array.from({ length: ELLIPSE_SAMPLES }, (_, i) =>
  Math.cos((i / ELLIPSE_SAMPLES) * Math.PI * 2),
);
const SAMPLE_SIN = Array.from({ length: ELLIPSE_SAMPLES }, (_, i) =>
  Math.sin((i / ELLIPSE_SAMPLES) * Math.PI * 2),
);

export function InteractiveDotBackground() {
  const backgroundRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!backgroundRef.current) {
      return;
    }

    const backgroundElement = backgroundRef.current;
    const rootFontSize = parseFloat(
      window.getComputedStyle(document.documentElement).fontSize,
    ) || 16;
    const baseRadius = BASE_RADIUS_REM * rootFontSize;

    const target = { x: -400, y: -400 };
    const current = { x: -400, y: -400 };
    const velocity = { x: 0, y: 0 };
    let rafId: number | null = null;
    let lastMoveAt = 0;

    function updateClipPath(trailX: number, trailY: number, dx: number, dy: number) {
      const distance = Math.hypot(dx, dy);
      const angle = distance > 0.5 ? Math.atan2(dy, dx) : 0;
      const stretch = Math.min(distance / STRETCH_REFERENCE_PX, 1);

      // Major axis grows gently with distance, never stretching far from the circle.
      const rx = baseRadius + distance * STRETCH_GROWTH;
      // Perpendicular axis collapses subtly while moving.
      const ry = baseRadius * (1 - stretch * SQUASH_AMOUNT);

      const cx = trailX + dx * 0.5;
      const cy = trailY + dy * 0.5;

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      let polygon = "polygon(";
      for (let i = 0; i < ELLIPSE_SAMPLES; i++) {
        const localX = rx * SAMPLE_COS[i];
        const localY = ry * SAMPLE_SIN[i];
        const px = cx + localX * cosA - localY * sinA;
        const py = cy + localX * sinA + localY * cosA;
        polygon += `${px}px ${py}px`;
        polygon += i === ELLIPSE_SAMPLES - 1 ? ")" : ", ";
      }

      backgroundElement.style.setProperty("--dot-clip-shape", polygon);
    }

    function paint() {
      const dx = target.x - current.x;
      const dy = target.y - current.y;

      // Snappier spring: stronger pull + lighter damping. Trail follows the cursor
      // closely, so the deformation stays close to a circle with subtle bounce.
      velocity.x = velocity.x * 0.86 + dx * 0.045;
      velocity.y = velocity.y * 0.86 + dy * 0.045;
      current.x += velocity.x;
      current.y += velocity.y;

      backgroundElement.style.setProperty("--dot-pointer-x", `${current.x}px`);
      backgroundElement.style.setProperty("--dot-pointer-y", `${current.y}px`);
      updateClipPath(current.x, current.y, dx, dy);

      const stillMoving =
        Math.abs(dx) > 0.4 ||
        Math.abs(dy) > 0.4 ||
        Math.abs(velocity.x) > 0.04 ||
        Math.abs(velocity.y) > 0.04;
      const recentlyActive = performance.now() - lastMoveAt < 7000;

      if (stillMoving || recentlyActive) {
        rafId = window.requestAnimationFrame(paint);
      } else {
        rafId = null;
      }
    }

    function ensureLoop() {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(paint);
      }
    }

    function handlePointerMove(event: PointerEvent) {
      target.x = event.clientX;
      target.y = event.clientY;
      lastMoveAt = performance.now();
      backgroundElement.dataset.pointer = "active";
      ensureLoop();
    }

    function handlePointerLeave() {
      delete backgroundElement.dataset.pointer;
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return <div ref={backgroundRef} aria-hidden="true" className="interactive-dot-background" />;
}
