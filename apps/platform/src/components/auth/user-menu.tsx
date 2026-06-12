"use client";

import Link from "next/link";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { SURVEYS_ROUTE } from "@/lib/survey/routes";

function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d="M3.5 5.25A1.75 1.75 0 0 1 5.25 3.5h3.5A1.75 1.75 0 0 1 10.5 5.25v3.5A1.75 1.75 0 0 1 8.75 10.5h-3.5A1.75 1.75 0 0 1 3.5 8.75v-3.5Zm6 6A1.75 1.75 0 0 1 11.25 9.5h3.5a1.75 1.75 0 0 1 1.75 1.75v3.5a1.75 1.75 0 0 1-1.75 1.75h-3.5a1.75 1.75 0 0 1-1.75-1.75v-3.5Zm-6 0A1.75 1.75 0 0 1 5.25 9.5h1.5A1.75 1.75 0 0 1 8.5 11.25v3.5A1.75 1.75 0 0 1 6.75 16.5h-1.5A1.75 1.75 0 0 1 3.5 14.75v-3.5Zm8-6A1.75 1.75 0 0 1 13.25 3.5h1.5a1.75 1.75 0 0 1 1.75 1.75v1.5a1.75 1.75 0 0 1-1.75 1.75h-1.5A1.75 1.75 0 0 1 11.5 6.75v-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 5.5V4a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 0 4 4v12a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 12 16v-1.5M9 10h8m0 0-2.5-2.5M17 10l-2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function getInitials(firstName: string | null | undefined, lastName: string | null | undefined, email: string | null | undefined) {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();

  if (initials) {
    return initials;
  }

  return email?.trim()?.[0]?.toUpperCase() ?? "?";
}

function getSignOutReturnTo() {
  return window.location.origin;
}

type UserMenuProps = {
  trigger?: "avatar" | "row";
  rowLabel?: ReactNode;
};

export function UserMenu({ trigger = "avatar", rowLabel = "Account" }: UserMenuProps) {
  const { user, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) {
      return;
    }

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (loading || !user) {
    return null;
  }

  const initials = getInitials(user.firstName, user.lastName, user.email);
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  const triggerEl = trigger === "avatar" ? (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => setIsOpen((prev) => !prev)}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-label="Account menu"
      className="clay-button-hover inline-flex h-11 w-11 items-center justify-center rounded-full bg-(--surface-panel-strong) text-sm font-bold text-(--ink) ring-1 ring-(--line-strong) shadow-(--shadow-soft)"
    >
      {initials}
    </button>
  ) : (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => setIsOpen((prev) => !prev)}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      className="clay-button-hover flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-(--line) px-3 py-2 text-sm font-semibold text-(--ink)"
    >
      <span className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-(--surface-panel-strong) text-xs font-bold ring-1 ring-(--line-strong)">
          {initials}
        </span>
        <span>{rowLabel}</span>
      </span>
      <span className="text-xs text-(--ink-soft)">{displayName}</span>
    </button>
  );

  const panel = isOpen && panelPos ? (
    <>
      <button
        type="button"
        aria-label="Close account menu"
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 z-[100] cursor-default bg-transparent"
      />
      <div
        ref={panelRef}
        role="menu"
        aria-label="Account menu"
        style={{ top: panelPos.top, right: panelPos.right }}
        className="fixed z-[101] w-64 rounded-2xl border border-(--line-strong) bg-(--surface-panel-strong) p-2 shadow-(--shadow-strong)"
      >
        <div className="px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--muted)">
            Signed in as
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-(--ink)">{displayName}</p>
          {user.email && displayName !== user.email ? (
            <p className="truncate text-xs text-(--ink-soft)">{user.email}</p>
          ) : null}
        </div>

        <div className="my-1 h-px bg-(--line)" />

        <Link
          href={SURVEYS_ROUTE}
          role="menuitem"
          onClick={() => setIsOpen(false)}
          className="clay-button-hover flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-(--ink)"
        >
          <DashboardIcon />
          <span>Dashboard</span>
        </Link>

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setIsOpen(false);
            void signOut({ returnTo: getSignOutReturnTo() });
          }}
          className="clay-button-hover flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-(--ink)"
        >
          <SignOutIcon />
          <span>Sign out</span>
        </button>
      </div>
    </>
  ) : null;

  return (
    <>
      {triggerEl}
      {isMounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
