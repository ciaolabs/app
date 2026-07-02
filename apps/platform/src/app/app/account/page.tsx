import { Suspense } from "react";
import { getInitialAuth, requireCurrentUserId } from "@ciaobang/auth";

import { getOrCreateAccount, getPreferences } from "@/lib/account/repository";
import { getChatRepository } from "@/lib/chat/repository";
import { routes } from "@/lib/routes";
import { AccountShell } from "@/components/account/account-shell";

// Per-user, auth-gated page: under cacheComponents (PPR) the prerendered shell
// is only the skeleton below — everything that reads the session or the
// database lives inside the Suspense boundary and streams per request.

async function AccountLoader() {
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

function AccountSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16" aria-busy="true" aria-label="Loading account">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-(--surface-panel-strong)" />
      <div className="mt-8 space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-(--surface-panel-strong)" />
        <div className="h-24 animate-pulse rounded-2xl bg-(--surface-panel-strong)" />
        <div className="h-24 animate-pulse rounded-2xl bg-(--surface-panel-strong)" />
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <AccountLoader />
    </Suspense>
  );
}
