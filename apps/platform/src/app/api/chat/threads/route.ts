import { NextResponse } from "next/server";

import { getCurrentUserId } from "@ciaobang/auth";
import { createThreadTitle } from "@/lib/chat/prompt";
import { getChatRepository } from "@/lib/chat/repository";


export async function GET(request: Request) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json({ error: "Authentication required.", threads: [] }, { status: 401 });
  }

  const threads = await getChatRepository().listThreads(userId);
  return NextResponse.json({ threads });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { title?: string };
  const thread = await getChatRepository().createThread({
    userId,
    title: createThreadTitle(body.title ?? "New chat"),
  });

  return NextResponse.json({ thread }, { status: 201 });
}
