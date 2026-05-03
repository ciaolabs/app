import { getInitialAuth, requireCurrentUserId } from "@ciaobang/auth";

import { getApiKeyProviders, getOrCreateAccount, getPreferences } from "@/lib/account/repository";
import { AccountShell } from "@/components/account/account-shell";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const userId = await requireCurrentUserId();

  const [auth, account, apiKeys, preferences] = await Promise.all([
    getInitialAuth(),
    getOrCreateAccount(userId).catch(() => null),
    getApiKeyProviders(userId).catch(() => ({ anthropic: false, google: false })),
    getPreferences(userId).catch(() => ({ chatModel: "gemini-2.5-flash" })),
  ]);

  return (
    <AccountShell
      email={auth.user?.email ?? ""}
      displayName={account?.display_name ?? ""}
      organization={account?.organization ?? ""}
      chatModel={preferences.chatModel}
      hasAnthropicKey={apiKeys.anthropic}
      hasGoogleKey={apiKeys.google}
      dbError={!account}
    />
  );
}
