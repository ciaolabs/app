import { Suspense } from "react";
import { requireCurrentUserId } from "@ciaobang/auth";

import { getChatRepository } from "@/lib/chat/repository";
import { EMPTY_SURVEY_CHAT_CONTEXT } from "@/lib/chat/survey-context";
import { loadSurveyChatContext } from "@/lib/chat-context-loader";
import { getApiKeyProviders, getPreferences } from "@/lib/account/repository";
import { DEFAULT_CHAT_MODEL } from "@/lib/account/models";
import { ChatShell } from "@/components/chat/chat-shell";
import { ChatSkeleton } from "@/components/chat/chat-skeleton";

async function ChatLoader() {
  const userId = await requireCurrentUserId({ returnPathname: "/chat" });
  const isDev = process.env.NODE_ENV === "development";
  const [threads, surveyContext, providers, preferences] = await Promise.all([
    getChatRepository().listThreads(userId).catch(() => []),
    loadSurveyChatContext(userId).catch(() => EMPTY_SURVEY_CHAT_CONTEXT),
    isDev
      ? Promise.resolve({ anthropic: true, google: true })
      : getApiKeyProviders(userId).catch(() => ({ anthropic: false, google: false })),
    getPreferences(userId).catch(() => ({ chatModel: DEFAULT_CHAT_MODEL })),
  ]);

  return (
    <ChatShell
      initialThreads={threads}
      surveyContext={surveyContext}
      apiKeyProviders={providers}
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
