import React from "react";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

Object.defineProperty(globalThis, "__clerkTestSignedIn", {
  value: false,
  writable: true,
});

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  useAuth: () => {
    const signedIn = Boolean((globalThis as { __clerkTestSignedIn?: boolean }).__clerkTestSignedIn);

    return {
      isLoaded: true,
      isSignedIn: signedIn,
      getToken: vi.fn().mockResolvedValue(signedIn ? "test_token" : null),
    };
  },
  Show: ({
    when,
    children,
  }: {
    when: "signed-in" | "signed-out";
    children: React.ReactNode;
  }) => {
    const signedIn = Boolean((globalThis as { __clerkTestSignedIn?: boolean }).__clerkTestSignedIn);

    if ((when === "signed-in" && signedIn) || (when === "signed-out" && !signedIn)) {
      return React.createElement(React.Fragment, null, children);
    }

    return null;
  },
  SignInButton: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  SignUpButton: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  UserButton: Object.assign(
    ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        "div",
        { "data-testid": "clerk-user-button" },
        React.createElement("span", null, "Account menu"),
        children,
      ),
    {
      MenuItems: ({ children }: { children: React.ReactNode }) =>
        React.createElement("div", { "data-testid": "clerk-user-menu-items" }, children),
      Link: ({
        href,
        label,
        labelIcon,
      }: {
        href: string;
        label: string;
        labelIcon?: React.ReactNode;
      }) => React.createElement("a", { href }, labelIcon, React.createElement("span", null, label)),
    },
  ),
  SignIn: () => React.createElement("div", { "data-testid": "clerk-sign-in" }, "Clerk Sign In"),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

Object.defineProperty(window, "scrollTo", {
  value: () => undefined,
  writable: true,
});

Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
  value: () => undefined,
  writable: true,
});

class MockIntersectionObserver {
  observe() {}

  unobserve() {}

  disconnect() {}
}

Object.defineProperty(window, "IntersectionObserver", {
  value: MockIntersectionObserver,
  writable: true,
});
