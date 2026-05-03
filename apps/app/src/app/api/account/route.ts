import { NextResponse } from "next/server";

import { getCurrentUserId, getInitialAuth } from "@ciaobang/auth";

import {
  deleteAccount,
  getApiKeyProviders,
  getOrCreateAccount,
  getPreferences,
} from "@/lib/account/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await getCurrentUserId({ request });
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [auth, account, apiKeys, preferences] = await Promise.all([
    getInitialAuth(),
    getOrCreateAccount(userId),
    getApiKeyProviders(userId),
    getPreferences(userId),
  ]);

  return NextResponse.json({
    email: auth.user?.email ?? "",
    displayName: account.display_name ?? "",
    organization: account.organization ?? "",
    apiKeys,
    preferences,
  });
}

export async function DELETE(request: Request) {
  const userId = await getCurrentUserId({ request });
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await deleteAccount(userId);
  return NextResponse.json({ ok: true });
}
