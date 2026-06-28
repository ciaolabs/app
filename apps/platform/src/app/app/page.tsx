import { Suspense } from "react";
import { requireCurrentUserId } from "@ciaobang/auth";

import { getChatRepository } from "@/lib/chat/repository";
import { routes } from "@/lib/routes";
import { EMPTY_SURVEY_CHAT_CONTEXT } from "@/lib/chat/survey-context";
import { loadSurveyChatContext } from "@/lib/chat-context-loader";
import { getPreferences } from "@/lib/account/repository";
import { DEFAULT_CHAT_MODEL } from "@/lib/account/models";
import { ChatShell } from "@/components/chat/chat-shell";
import { ChatSkeleton } from "@/components/chat/chat-skeleton";
import { logger } from "@/lib/logger";

// /app is a per-user, auth-gated page. Without this it was emitting a
// `cache-control: public` response for the unauthenticated shell that Vercel's
// CDN cached and then served (the cache key does not vary on the session
// cookie) to *authenticated* users too — who got the cached signed-out
// skeleton instead of their chat, rendering as a blank page. force-dynamic
// makes every request render fresh and non-cacheable (private, no-store).
export const dynamic = "force-dynamic";

// The chat shell must stay reachable even when the database is slow or briefly
// unreachable. A plain `.catch()` only handles rejections, not a connection
// that hangs (a paused/saturated pooler can stall indefinitely) — which leaves
// this server render pending until the platform kills the request and the user
// sees a timeout / blank /app page. We additionally bound each dependency load
// so the shell always renders with usable defaults; the real threads and
// preferences load on the next request once the database recovers.
const DB_LOAD_TIMEOUT_MS = 8000;

async function loadOrFallback<T>(
  label: string,
  load: () => Promise<T>,
  fallback: T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Attach the catch up front so a late rejection (after the timeout already
  // won the race) can never become an unhandled rejection.
  const guarded = load().catch((error) => {
    logger.warn({ label, error }, "Chat dependency load failed; using fallback");
    return fallback;
  });
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      logger.warn({ label }, "Chat dependency load timed out; using fallback");
      resolve(fallback);
    }, DB_LOAD_TIMEOUT_MS);
  });
  try {
    return await Promise.race([guarded, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function ChatLoader() {
  const userId = await requireCurrentUserId({ returnPathname: routes.chat });
  // API keys are never read here: they live only in the browser and are sent
  // per turn by the client. The server only needs the (non-sensitive) model
  // preference and the user's threads.
  const [threads, surveyContext, preferences] = await Promise.all([
    loadOrFallback("threads", () => getChatRepository().listThreads(userId), []),
    loadOrFallback("surveyContext", () => loadSurveyChatContext(userId), EMPTY_SURVEY_CHAT_CONTEXT),
    loadOrFallback("preferences", () => getPreferences(userId), {
      chatModel: DEFAULT_CHAT_MODEL,
    }),
  ]);

  return (
    <ChatShell
      initialThreads={threads}
      surveyContext={surveyContext}
      initialChatModel={preferences.chatModel}
    />
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatLoader />
    </Suspense>
  );
}
