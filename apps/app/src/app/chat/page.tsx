import { requireCurrentUserId } from "@ciaobang/auth";

import { getChatRepository } from "@/lib/chat/repository";
import { loadSurveyChatContext } from "@/lib/chat/survey-context.server";
import { ChatShell } from "@/components/chat/chat-shell";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const userId = await requireCurrentUserId();
  const [threads, surveyContext] = await Promise.all([
    getChatRepository().listThreads(userId).catch(() => []),
    loadSurveyChatContext(),
  ]);

  return <ChatShell initialThreads={threads} surveyContext={surveyContext} />;
}
