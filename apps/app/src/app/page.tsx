import { Suspense } from "react";
import { requireCurrentUserId } from "@ciaobang/auth";

import { getChatRepository } from "@/lib/chat/repository";
import { loadSurveyChatContext } from "@/lib/chat/survey-context.server";
import { hasAnyApiKey } from "@/lib/account/repository";
import { ChatShell } from "@/components/chat/chat-shell";
import { ChatSkeleton } from "@/components/chat/chat-skeleton";

async function ChatLoader() {
  const userId = await requireCurrentUserId();
  const [threads, surveyContext, apiKeys] = await Promise.all([
    getChatRepository().listThreads(userId).catch(() => []),
    loadSurveyChatContext(),
    process.env.NODE_ENV === "development"
      ? Promise.resolve(true)
      : hasAnyApiKey(userId).catch(() => false),
  ]);

  return <ChatShell initialThreads={threads} surveyContext={surveyContext} hasApiKeys={apiKeys} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatLoader />
    </Suspense>
  );
}
