import { NextResponse } from "next/server";

import { getCurrentUserId } from "@ciaobang/auth";
import { getChatRepository } from "@/lib/chat/repository";

export const dynamic = "force-dynamic";

type ChatThreadRouteContext = {
  params: Promise<{ threadId: string }>;
};

export async function GET(request: Request, context: ChatThreadRouteContext) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { threadId } = await context.params;
  const thread = await getChatRepository().getThread(userId, threadId);

  if (!thread) {
    return NextResponse.json(
      { error: "The selected chat thread is not available for this account." },
      { status: 404 },
    );
  }

  return NextResponse.json({ thread });
}
