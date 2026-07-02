import { getInitialAuth, requireCurrentUserId } from "@ciaobang/auth";

import { getOrCreateAccount, getPreferences } from "@/lib/account/repository";
import { getChatRepository } from "@/lib/chat/repository";
import { routes } from "@/lib/routes";
import { AccountShell } from "@/components/account/account-shell";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const userId = await requireCurrentUserId({ returnPathname: routes.account() });

  // API keys are intentionally not loaded here: they live only in the browser
  // (localStorage), so the account page detects them client-side.
  const [auth, account, preferences, threads] = await Promise.all([
    getInitialAuth(),
    getOrCreateAccount(userId).catch(() => null),
    getPreferences(userId).catch(() => ({ chatModel: "gemini-2.5-flash" })),
    getChatRepository().listThreads(userId).catch(() => []),
  ]);

  return (
    <AccountShell
      email={auth.user?.email ?? ""}
      displayName={account?.display_name ?? ""}
      organization={account?.organization ?? ""}
      chatModel={preferences.chatModel}
      dbError={!account}
      threads={threads}
    />
  );
}
