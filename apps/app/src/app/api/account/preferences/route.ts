import { NextResponse } from "next/server";

import { getCurrentUserId } from "@ciaobang/auth";

import { MODEL_OPTIONS } from "@/lib/account/models";
import { updatePreferences } from "@/lib/account/repository";

const VALID_MODELS = new Set(MODEL_OPTIONS.map((m) => m.value));

export async function PUT(request: Request) {
  const userId = await getCurrentUserId({ request });
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { chatModel?: string };
  const chatModel = body.chatModel;
  if (!chatModel || !VALID_MODELS.has(chatModel as never)) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  await updatePreferences(userId, chatModel);
  return NextResponse.json({ ok: true });
}
