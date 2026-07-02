import { LandingFooter } from "@/components/landing-footer";
import { LandingHeader } from "@/components/landing-header";
import { HeroCta } from "@/components/home/hero-cta";
import { SurveyChatPreview } from "@/components/home/survey-chat-preview";
import { SurveyPreview } from "@/components/home/survey-preview";
import { SurveyResultsPreview } from "@/components/home/survey-results-preview";

// The highest-traffic page: fully static so the CDN serves it without a
// serverless render or auth-cookie read. Signed-in state (header/footer/hero
// CTAs) resolves client-side inside the components themselves.
export default function HomePage() {
  return (
    <>
      <LandingHeader />
      <main className="mx-auto flex min-h-screen w-full max-w-[min(1800px,calc(100vw-2rem))] flex-col px-4 pt-0 sm:max-w-[min(1800px,calc(100vw-3rem))] sm:px-8 lg:max-w-[min(1800px,calc(100vw-4rem))] lg:px-10 xl:px-12 2xl:max-w-[min(1900px,calc(100vw-5rem))] 2xl:px-14">
        <section
        className="hero-sun relative mt-6 overflow-hidden rounded-3xl border border-(--line) px-4 py-10 shadow-(--shadow-soft) sm:px-8 sm:py-14 lg:px-10 lg:py-16"
      >
        <div className="relative">
          <div className="flex flex-col items-center text-center">
            <h1 className="max-w-5xl font-display text-5xl font-black leading-tight text-(--ink) sm:text-6xl lg:text-7xl">
              A closer read of <em className="italic">who you are</em>, one question at a time.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-(--ink-soft) sm:text-xl">
              Surveys to discover your personality and beliefs.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <HeroCta />

              <a
                href="https://github.com/ciaobang/surveys"
                target="_blank"
                rel="noreferrer"
                className="clay-button-hover inline-flex h-12 items-center gap-2 rounded-full border border-(--line-strong) bg-(--surface-panel-strong) px-6 text-sm font-semibold text-(--ink) shadow-(--shadow-soft)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Star on GitHub
              </a>
            </div>
          </div>

          <div id="surveys" className="relative z-10 mt-10 scroll-mt-24">
            <SurveyPreview />
          </div>

          <div className="relative h-40 sm:h-24">
            <div
              aria-hidden="true"
              className="connector-blob pointer-events-none absolute -left-4 -right-4 top-1/2 h-[36rem] -translate-y-1/2 sm:left-0 sm:right-0 sm:h-[42rem] sm:-translate-y-[85%]"
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-0 h-full w-px border-l border-dashed border-(--line-strong)"
            />

            <div className="absolute top-4 left-[8%] sm:left-[12%] lg:left-[15%]">
              <div
                className="relative inline-flex items-center rounded-full bg-(--surface-panel-strong) px-4 py-2 font-display text-sm text-(--ink) sm:px-5 sm:py-2.5 sm:text-[15px]"
                style={{
                  boxShadow:
                    "0 12px 24px -10px rgba(20, 15, 10, 0.22), 0 3px 6px -2px rgba(20, 15, 10, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 -2px 4px rgba(20, 15, 10, 0.04)",
                  filter:
                    "drop-shadow(2px 4px 4px rgba(20, 15, 10, 0.10))",
                }}
              >
                Survey done?
                <svg
                  aria-hidden="true"
                  className="absolute -top-[10px] right-7"
                  width="16"
                  height="14"
                  viewBox="0 0 16 14"
                  fill="none"
                >
                  <path
                    d="M 16 14 L 0 14 Q 4 12 7 6 Q 9 1 10.5 0.5 Q 12 0 12.5 2 Q 13 6 16 13 Z"
                    fill="var(--surface-panel-strong)"
                  />
                </svg>
              </div>
            </div>

            <div className="absolute bottom-4 right-[8%] sm:right-[12%] lg:right-[15%]">
              <div
                className="relative inline-flex items-center rounded-full bg-(--surface-panel-strong) px-4 py-2 font-display text-sm text-(--ink) sm:px-5 sm:py-2.5 sm:text-[15px]"
                style={{
                  boxShadow:
                    "0 12px 24px -10px rgba(20, 15, 10, 0.22), 0 3px 6px -2px rgba(20, 15, 10, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 -2px 4px rgba(20, 15, 10, 0.04)",
                  filter:
                    "drop-shadow(2px 4px 4px rgba(20, 15, 10, 0.10))",
                }}
              >
                Now meet your personality.
                <svg
                  aria-hidden="true"
                  className="absolute -bottom-[10px] left-7"
                  width="16"
                  height="14"
                  viewBox="0 0 16 14"
                  fill="none"
                >
                  <path
                    d="M 16 0 L 0 0 Q 4 2 7 8 Q 9 13 10.5 13.5 Q 12 14 12.5 12 Q 13 8 16 1 Z"
                    fill="var(--surface-panel-strong)"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div id="dashboards" className="relative z-10 scroll-mt-24">
            <SurveyResultsPreview />
          </div>

          <div className="relative h-40 sm:h-24">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-8 -right-8 top-1/2 h-[36rem] -translate-y-[15%] bg-center bg-no-repeat [background-size:180%_auto] sm:-left-8 sm:-right-8 sm:h-[42rem] sm:[background-size:100%_auto] lg:-left-10 lg:-right-10"
              style={{
                backgroundImage: 'url("/surveys-sun.png")',
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
              }}
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-0 h-full w-px border-l border-dashed border-(--line-strong)"
            />

            <div className="absolute top-4 left-[8%] sm:left-[12%] lg:left-[15%]">
              <div
                className="relative inline-flex items-center rounded-full bg-(--surface-panel-strong) px-4 py-2 font-display text-sm text-(--ink) sm:px-5 sm:py-2.5 sm:text-[15px]"
                style={{
                  boxShadow:
                    "0 12px 24px -10px rgba(20, 15, 10, 0.22), 0 3px 6px -2px rgba(20, 15, 10, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 -2px 4px rgba(20, 15, 10, 0.04)",
                  filter:
                    "drop-shadow(2px 4px 4px rgba(20, 15, 10, 0.10))",
                }}
              >
                Got your scores?
                <svg
                  aria-hidden="true"
                  className="absolute -top-[10px] right-7"
                  width="16"
                  height="14"
                  viewBox="0 0 16 14"
                  fill="none"
                >
                  <path
                    d="M 16 14 L 0 14 Q 4 12 7 6 Q 9 1 10.5 0.5 Q 12 0 12.5 2 Q 13 6 16 13 Z"
                    fill="var(--surface-panel-strong)"
                  />
                </svg>
              </div>
            </div>

            <div className="absolute bottom-4 right-[8%] sm:right-[12%] lg:right-[15%]">
              <div
                className="relative inline-flex items-center rounded-full bg-(--surface-panel-strong) px-4 py-2 font-display text-sm text-(--ink) sm:px-5 sm:py-2.5 sm:text-[15px]"
                style={{
                  boxShadow:
                    "0 12px 24px -10px rgba(20, 15, 10, 0.22), 0 3px 6px -2px rgba(20, 15, 10, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 -2px 4px rgba(20, 15, 10, 0.04)",
                  filter:
                    "drop-shadow(2px 4px 4px rgba(20, 15, 10, 0.10))",
                }}
              >
                Chat with Ciao! about them.
                <svg
                  aria-hidden="true"
                  className="absolute -bottom-[10px] left-7"
                  width="16"
                  height="14"
                  viewBox="0 0 16 14"
                  fill="none"
                >
                  <path
                    d="M 16 0 L 0 0 Q 4 2 7 8 Q 9 13 10.5 13.5 Q 12 14 12.5 12 Q 13 8 16 1 Z"
                    fill="var(--surface-panel-strong)"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div id="chat" className="relative z-10 scroll-mt-24">
            <SurveyChatPreview />
          </div>
        </div>
      </section>

        <LandingFooter />
      </main>
    </>
  );
}
