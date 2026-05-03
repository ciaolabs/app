import { requireCurrentUserId } from "@ciaobang/auth";

import { getChatRepository } from "@/lib/chat/repository";
import { loadSurveyChatContext } from "@/lib/chat/survey-context.server";
import { hasAnyApiKey } from "@/lib/account/repository";
import { ChatShell } from "@/components/chat/chat-shell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await requireCurrentUserId();
  const [threads, surveyContext, apiKeys] = await Promise.all([
    getChatRepository().listThreads(userId).catch(() => []),
    loadSurveyChatContext(),
    hasAnyApiKey(userId).catch(() => false),
  ]);

  return <ChatShell initialThreads={threads} surveyContext={surveyContext} hasApiKeys={apiKeys} />;
}
