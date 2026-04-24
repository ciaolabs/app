import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type ClerkKeylessConfig = {
  publishableKey?: string;
  secretKey?: string;
};

let cachedKeylessConfig: ClerkKeylessConfig | null | undefined;

function getKeylessConfigPath() {
  return path.join(process.cwd(), ".clerk", ".tmp", "keyless.json");
}

function readKeylessConfig() {
  if (cachedKeylessConfig !== undefined) {
    return cachedKeylessConfig;
  }

  const keylessConfigPath = getKeylessConfigPath();

  if (!existsSync(keylessConfigPath)) {
    cachedKeylessConfig = null;
    return cachedKeylessConfig;
  }

  try {
    const rawConfig = readFileSync(keylessConfigPath, "utf8");
    cachedKeylessConfig = JSON.parse(rawConfig) as ClerkKeylessConfig;
  } catch {
    cachedKeylessConfig = null;
  }

  return cachedKeylessConfig;
}

export function getClerkPublishableKey() {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? readKeylessConfig()?.publishableKey ?? null;
}

export function getClerkSecretKey() {
  return process.env.CLERK_SECRET_KEY ?? readKeylessConfig()?.secretKey ?? null;
}

export function isClerkConfigured() {
  return Boolean(getClerkPublishableKey() && getClerkSecretKey());
}
