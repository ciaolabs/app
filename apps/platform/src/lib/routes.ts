import { type SurveyType } from "@/lib/survey/types";

/**
 * The single source of truth for the platform's in-app URL topology.
 *
 * `routes` is for page navigation — anything that produces a destination the
 * browser shows: `href`, `<Link>`, `router.push`, `redirect`, and the
 * `returnPathname` handed to the auth adapter. `apiRoutes` is for `fetch()`
 * callers. Relocating a surface (e.g. moving `/chat`) or adding a basePath
 * becomes a one-file edit here, and links become testable data instead of
 * grep-able string literals.
 *
 * Boundary: the auth entry point (`/sign-in`, `?next=`) is NOT owned here. It
 * lives in `packages/auth`, which is app-agnostic — `/sign-in` is that
 * adapter's contract. This registry only supplies the `returnPathname` value
 * the app passes to it (where to land after login).
 */
export const routes = {
  home: "/",
  surveys: "/surveys",
  survey: (surveyType: SurveyType) => `/surveys/${surveyType}`,
  surveyDashboard: (surveyType: SurveyType) => `/surveys/${surveyType}/dashboard`,
  dashboard: "/dashboard",
  chat: "/chat",
  account: (anchor?: "models") => (anchor ? `/chat/account#${anchor}` : "/chat/account"),
  docs: (slug?: string) => (slug ? `/docs/${slug}` : "/docs"),
} as const;

/** API endpoints, for `fetch()` callers. */
export const apiRoutes = {
  surveyBase: (surveyType: SurveyType) => `/api/surveys/${surveyType}`,
  chat: "/api/chat",
  chatThreads: "/api/chat/threads",
  chatThread: (threadId: string) => `/api/chat/threads/${threadId}`,
  assist: "/api/assist",
  surveyContext: "/api/survey-context",
  account: "/api/account",
  accountProfile: "/api/account/profile",
  accountPreferences: "/api/account/preferences",
  accountApiKey: (provider: string) => `/api/account/api-keys/${provider}`,
} as const;
