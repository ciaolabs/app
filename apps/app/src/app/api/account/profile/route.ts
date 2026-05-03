import { NextResponse } from "next/server";

import { getCurrentUserId } from "@ciaobang/auth";

import { updateProfile } from "@/lib/account/repository";

export async function PUT(request: Request) {
  const userId = await getCurrentUserId({ request });
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { displayName?: string; organization?: string };
  await updateProfile(
    userId,
    body.displayName?.trim() || null,
    body.organization?.trim() || null,
  );
  return NextResponse.json({ ok: true });
}
