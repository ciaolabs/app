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

async function ChatLoader() {
  const userId = await requireCurrentUserId({ returnPathname: routes.chat });
  // API keys are never read here: they live only in the browser and are sent
  // per turn by the client. The server only needs the (non-sensitive) model
  // preference and the user's threads.
  const [threads, surveyContext, preferences] = await Promise.all([
    getChatRepository().listThreads(userId).catch(() => []),
    loadSurveyChatContext(userId).catch(() => EMPTY_SURVEY_CHAT_CONTEXT),
    getPreferences(userId).catch(() => ({ chatModel: DEFAULT_CHAT_MODEL })),
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
