"use client";

import { AuthKitProvider, useAuth } from "@workos-inc/authkit-nextjs/components";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";

type InitialAuth = ComponentProps<typeof AuthKitProvider>["initialAuth"];

// Kept in sync with the auth proxy (packages/auth/src/proxy.ts), which sets and
// clears the cookie alongside the HttpOnly WorkOS session cookie.
const SESSION_HINT_COOKIE = "has-session";

const SIGNED_OUT_AUTH = { user: null } as unknown as NonNullable<InitialAuth>;

export function hasSessionHint(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie.split("; ").includes(`${SESSION_HINT_COOKIE}=1`);
}

/**
 * AuthKitProvider wrapper for the static root layout. Visitors without the
 * session-hint cookie cannot have a session, so they get a resolved signed-out
 * state up front and AuthKit skips its session-check server action entirely —
 * one less serverless invocation per anonymous page view. Visitors with the
 * hint resolve their session client-side as before.
 *
 * Hydration safety: the initializer runs during the hydration render, and the
 * two branches differ only in the provider's `loading` flag with `user: null`
 * either way — no component renders different signed-out DOM for that flag,
 * so both branches match the prerendered HTML.
 */
export function AuthProvider({
  initialAuth,
  children,
}: {
  initialAuth?: InitialAuth;
  children: ReactNode;
}) {
  const [resolvedInitialAuth] = useState<InitialAuth | undefined>(() => {
    if (initialAuth) {
      return initialAuth; // local-dev stub
    }
    return hasSessionHint() ? undefined : SIGNED_OUT_AUTH;
  });

  return <AuthKitProvider initialAuth={resolvedInitialAuth}>{children}</AuthKitProvider>;
}

/**
 * Signed-in state for the landing surfaces, upgraded optimistically: while the
 * client-side session check is still in flight, trust the hint cookie (it is
 * only ever set for visitors who actually signed in). The hint is read in an
 * effect — not during render — so hydration still matches the prerendered
 * signed-out HTML; the CTA swaps right after hydration instead of a full
 * session round trip later.
 */
export function useOptimisticSignedIn(): boolean {
  const { user, loading } = useAuth();
  const [hint, setHint] = useState(false);

  useEffect(() => {
    setHint(hasSessionHint());
  }, []);

  if (user) {
    return true;
  }

  return loading && hint;
}
