import { NextResponse } from "next/server";

import { getCurrentUserId } from "@ciaobang/auth";

import { accountStorageErrorResponse } from "../../error-response";
import type { ApiKeyProvider } from "@/lib/account/models";
import { removeApiKey, setApiKey } from "@/lib/account/repository";

const VALID_PROVIDERS = new Set<ApiKeyProvider>(["anthropic", "google"]);

function parseProvider(raw: string): ApiKeyProvider | null {
  return VALID_PROVIDERS.has(raw as ApiKeyProvider) ? (raw as ApiKeyProvider) : null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const userId = await getCurrentUserId({ request });
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider: raw } = await params;
  const provider = parseProvider(raw);
  if (!provider) return NextResponse.json({ error: "Invalid provider" }, { status: 400 });

  const body = (await request.json()) as { key?: string };
  const key = body.key?.trim();
  if (!key) return NextResponse.json({ error: "API key is required" }, { status: 400 });

  try {
    await setApiKey(userId, provider, key);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return accountStorageErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const userId = await getCurrentUserId({ request });
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider: raw } = await params;
  const provider = parseProvider(raw);
  if (!provider) return NextResponse.json({ error: "Invalid provider" }, { status: 400 });

  try {
    await removeApiKey(userId, provider);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return accountStorageErrorResponse(error);
  }
}
