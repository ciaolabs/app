import { NextResponse } from "next/server";

import { getCurrentUserId } from "@ciaobang/auth";

import { loadSurveyChatContext } from "@/lib/chat-context-loader";


export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required.", context: null },
      { status: 401 },
    );
  }

  const context = await loadSurveyChatContext(userId);
  return NextResponse.json({ context });
}
