"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight } from "lucide-react";

// The real AiSearchBar drags the whole assist stack (ai + @ai-sdk/react,
// markdown renderer, zod, lottie) into the bundle — none of which a visitor
// needs until they actually reach for the bar. This wrapper renders a
// markup-identical collapsed pill immediately and swaps in the real component
// on the first user gesture (or after idle), so the heavy chunks never block
// the initial page load.
const AiSearchBarImpl = dynamic(
  () => import("./ai-chat").then((m) => ({ default: m.AiSearchBar })),
  { ssr: false },
);

function useNearBottom(threshold = 100) {
  const [nearBottom, setNearBottom] = useState(false);

  useEffect(() => {
    function check() {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const viewHeight = window.innerHeight;
      setNearBottom(scrollY + viewHeight >= docHeight - threshold);
    }

    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [threshold]);

  return nearBottom;
}

/** Collapsed pill lookalike shown until the real search bar loads. */
function CollapsedPill({ onIntent }: { onIntent: () => void }) {
  const [mounted, setMounted] = useState(false);
  const nearBottom = useNearBottom(150);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-7 pt-2 transition-opacity duration-300"
      style={{ opacity: nearBottom ? 0 : 1 }}
    >
      <div
        className="ai-pill pointer-events-auto flex w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ease-out"
        style={{
          maxHeight: "3rem",
          pointerEvents: nearBottom ? "none" : "auto",
        }}
      >
        <div className="flex items-center gap-2 px-5 py-2.5">
          <input
            type="text"
            onFocus={onIntent}
            placeholder="Ask Ciao!"
            className="ai-chat-input ai-pill-input flex-1 bg-transparent text-[13px] outline-none"
          />
          <div className="flex items-center gap-1.5">
            <kbd className="ai-pill-kbd hidden items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] sm:flex">
              Ctrl+I
            </kbd>
            <button
              type="button"
              onClick={onIntent}
              aria-label="Ask Ciao!"
              className="ai-pill-btn flex size-7 items-center justify-center rounded-full transition-colors"
            >
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function LazyAiSearchBar() {
  const [ready, setReady] = useState(false);
  const pendingFocus = useRef(false);

  useEffect(() => {
    if (ready) return;

    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const activate = () => {
      cleanup();
      setReady(true);
    };

    const opts: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener("pointermove", activate, opts);
    window.addEventListener("touchstart", activate, opts);
    window.addEventListener("keydown", activate, opts);
    window.addEventListener("scroll", activate, opts);

    if ("requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(activate, { timeout: 4000 });
    } else {
      timeoutHandle = setTimeout(activate, 3500);
    }

    function cleanup() {
      window.removeEventListener("pointermove", activate);
      window.removeEventListener("touchstart", activate);
      window.removeEventListener("keydown", activate);
      window.removeEventListener("scroll", activate);
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle);
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    }

    return cleanup;
  }, [ready]);

  // If the visitor focused the placeholder before the real bar arrived, hand
  // focus over so their keystrokes land in the real input.
  useEffect(() => {
    if (!ready || !pendingFocus.current) return;
    const id = setTimeout(() => {
      document.querySelector<HTMLInputElement>(".ai-pill-input")?.focus();
    }, 50);
    return () => clearTimeout(id);
  }, [ready]);

  if (!ready) {
    return (
      <CollapsedPill
        onIntent={() => {
          pendingFocus.current = true;
          setReady(true);
        }}
      />
    );
  }

  return <AiSearchBarImpl />;
}
