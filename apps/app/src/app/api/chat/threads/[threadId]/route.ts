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

export async function PATCH(request: Request, context: ChatThreadRouteContext) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { threadId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { title?: string };

  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "A non-empty title is required." }, { status: 400 });
  }

  const thread = await getChatRepository().renameThread({
    userId,
    threadId,
    title: body.title.trim(),
  });

  if (!thread) {
    return NextResponse.json(
      { error: "The selected chat thread is not available for this account." },
      { status: 404 },
    );
  }

  return NextResponse.json({ thread });
}

export async function DELETE(request: Request, context: ChatThreadRouteContext) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { threadId } = await context.params;
  const deleted = await getChatRepository().deleteThread({ userId, threadId });

  if (!deleted) {
    return NextResponse.json(
      { error: "The selected chat thread is not available for this account." },
      { status: 404 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
