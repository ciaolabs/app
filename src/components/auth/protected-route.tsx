"use client";

import { type ReactNode, useEffect } from "react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useRouter } from "next/navigation";

type ProtectedRouteProps = {
  children: ReactNode;
  loadingTitle?: string;
  loadingBody?: string;
  redirectingTitle?: string;
  redirectingBody?: string;
};

function StatusPanel({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto mt-4 max-w-2xl rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] p-8 shadow-[var(--shadow-strong)]">
      <p className="clay-label">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-4xl text-[var(--ink)]">{title}</h1>
      <p className="mt-4 text-base leading-8 text-[var(--ink-soft)]">{body}</p>
    </div>
  );
}

export function ProtectedRoute({
  children,
  loadingTitle = "Preparing your survey",
  loadingBody = "We are checking your session and loading the account workspace.",
  redirectingTitle = "Returning to sign in",
  redirectingBody = "Your session is not available on this page yet, so we are sending you back to the sign-in panel.",
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isSignedIn = Boolean(user);

  useEffect(() => {
    if (!loading && !isSignedIn) {
      router.replace("/");
    }
  }, [loading, isSignedIn, router]);

  if (loading) {
    return (
      <StatusPanel
        eyebrow="Loading account"
        title={loadingTitle}
        body={loadingBody}
      />
    );
  }

  if (!isSignedIn) {
    return (
      <StatusPanel
        eyebrow="Redirecting"
        title={redirectingTitle}
        body={redirectingBody}
      />
    );
  }

  return <>{children}</>;
}
