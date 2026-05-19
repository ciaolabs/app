"use client";

import { useEffect, useRef } from "react";

type SerendipityUniform = { value: number };
type SerendipityOgl = {
  initialize: (host: HTMLElement) => void;
  dispose: () => void;
  program: {
    uniforms: {
      uSpeed: SerendipityUniform;
      uScale: SerendipityUniform;
      uRed: SerendipityUniform;
      uGreen: SerendipityUniform;
      uBlue: SerendipityUniform;
      uIntensity: SerendipityUniform;
      uBackgroundRed: SerendipityUniform;
      uBackgroundGreen: SerendipityUniform;
      uBackgroundBlue: SerendipityUniform;
      uInterpolation: SerendipityUniform;
      uPattern: SerendipityUniform;
    };
  };
};

declare global {
  interface Window {
    serendipity_ogl?: SerendipityOgl;
  }
}

const SCRIPT_SRC = "/scripts/serendipity-ogl.min.js";
const SCRIPT_ID = "serendipity-ogl-script";

// Cloud-like noise field. The shader composes:
//   col = value * vec3(uRed, uGreen, uBlue);  value = noise * uInterpolation + uIntensity
//   gl_FragColor = mix(col, vec3(uBackground*), 0.4)
type Preset = typeof LIGHT_PRESET;

// Light theme: original mymind "private oasis" preset — flat-ish white/blue.
const LIGHT_PRESET = {
  uSpeed: 0.6,
  uScale: 2.7,
  uRed: 0.9,
  uGreen: 0.95,
  uBlue: 1,
  uIntensity: 1.8,
  uBackgroundRed: 0.07,
  uBackgroundGreen: 0.05,
  uBackgroundBlue: 0.13,
  uInterpolation: 0.5,
  uPattern: 0.13,
};

// Dark theme: deep navy clouds on near-black base.
const DARK_PRESET: Preset = {
  uSpeed: 0.55,
  uScale: 2.0,
  uRed: 0.22,
  uGreen: 0.26,
  uBlue: 0.36,
  uIntensity: 0.7,
  uBackgroundRed: 0.04,
  uBackgroundGreen: 0.05,
  uBackgroundBlue: 0.09,
  uInterpolation: 0.6,
  uPattern: 0.18,
};

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.serendipity_ogl) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.loaded === "true") return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("serendipity load failed")), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => reject(new Error("serendipity load failed")),
      { once: true },
    );
    document.head.appendChild(script);
  });
}

function applyPreset(lib: SerendipityOgl, preset: Preset) {
  const { uniforms } = lib.program;
  uniforms.uSpeed.value = preset.uSpeed;
  uniforms.uScale.value = preset.uScale;
  uniforms.uRed.value = preset.uRed;
  uniforms.uGreen.value = preset.uGreen;
  uniforms.uBlue.value = preset.uBlue;
  uniforms.uIntensity.value = preset.uIntensity;
  uniforms.uBackgroundRed.value = preset.uBackgroundRed;
  uniforms.uBackgroundGreen.value = preset.uBackgroundGreen;
  uniforms.uBackgroundBlue.value = preset.uBackgroundBlue;
  uniforms.uInterpolation.value = preset.uInterpolation;
  uniforms.uPattern.value = preset.uPattern;
}

function presetForTheme(): Preset {
  if (typeof document === "undefined") return LIGHT_PRESET;
  return document.documentElement.dataset.theme === "dark" ? DARK_PRESET : LIGHT_PRESET;
}

export function AnimatedGradientBackdrop({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let surgeAmount = 0;
    let surgeRaf: number | null = null;

    function decaySurge() {
      surgeRaf = null;
      surgeAmount *= 0.95;
      const lib = window.serendipity_ogl;
      if (!lib) return;
      const preset = presetForTheme();
      lib.program.uniforms.uSpeed.value = preset.uSpeed * (1 + surgeAmount * 0.35);

      if (surgeAmount > 0.01) {
        surgeRaf = requestAnimationFrame(decaySurge);
      } else {
        applyPreset(lib, preset);
      }
    }

    function handleClickBurst() {
      surgeAmount = 1.0;
      if (surgeRaf === null) surgeRaf = requestAnimationFrame(decaySurge);
    }

    loadScript()
      .then(() => {
        if (cancelled) return;
        const lib = window.serendipity_ogl;
        if (!lib) return;
        try {
          lib.initialize(host);
          applyPreset(lib, presetForTheme());
        } catch (err) {
          console.error("AnimatedGradientBackdrop init failed", err);
        }
      })
      .catch((err) => {
        console.error("AnimatedGradientBackdrop script load failed", err);
      });

    const themeObserver = new MutationObserver(() => {
      const lib = window.serendipity_ogl;
      if (lib) applyPreset(lib, presetForTheme());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      cancelled = true;
      themeObserver.disconnect();
      const lib = window.serendipity_ogl;
      if (lib) {
        try {
          lib.dispose();
        } catch {
          /* ignore */
        }
      }
      host.querySelectorAll("canvas").forEach((c) => c.remove());
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className={className} />;
}
