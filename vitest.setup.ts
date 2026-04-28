import React from "react";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

Object.defineProperty(globalThis, "__authTestSignedIn", {
  value: false,
  writable: true,
});

const testUser = {
  id: "user_test",
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
};

function isSignedIn() {
  return Boolean((globalThis as { __authTestSignedIn?: boolean }).__authTestSignedIn);
}

vi.mock("@workos-inc/authkit-nextjs", () => ({
  withAuth: vi.fn(async () => (isSignedIn() ? { user: testUser } : { user: null })),
  getSignInUrl: vi.fn(async () => "https://workos.example/sign-in"),
  getSignUpUrl: vi.fn(async () => "https://workos.example/sign-up"),
  signOut: vi.fn(),
  getTokenClaims: vi.fn(),
  handleAuth: vi.fn(),
  authkitMiddleware: vi.fn(),
}));

vi.mock("@workos-inc/authkit-nextjs/components", () => ({
  AuthKitProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  useAuth: () => ({
    user: isSignedIn() ? testUser : null,
    loading: false,
    signOut: vi.fn(),
    refreshAuth: vi.fn(),
    switchToOrganization: vi.fn(),
  }),
  useAccessToken: () => ({
    accessToken: isSignedIn() ? "test_token" : null,
    loading: false,
    error: null,
    refresh: vi.fn(),
    getAccessToken: vi.fn(async () => (isSignedIn() ? "test_token" : null)),
  }),
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
