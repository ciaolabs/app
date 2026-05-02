import { NextResponse } from "next/server";

import { getCurrentUserId } from "@ciaobang/auth";

import { loadSurveyChatContext } from "@/lib/chat-context-loader";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await getCurrentUserId({ acceptsSessionToken: true, request });

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required.", context: null },
      { status: 401 },
    );
  }

  const context = await loadSurveyChatContext(userId);
  return NextResponse.json({ context });
}
