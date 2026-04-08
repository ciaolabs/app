import { describe, expect, it } from "vitest";

import { clerkAppName, clerkLocalization } from "@/lib/clerk";

describe("clerkLocalization", () => {
  it("brands the combined sign-in title with the site name", () => {
    expect(clerkLocalization.signIn.start.titleCombined).toBe(`Continue to ${clerkAppName}`);
    expect(clerkLocalization.signIn.start.title).toBe(`Sign in to ${clerkAppName}`);
  });

  it("keeps follow-up auth steps on the same app name", () => {
    expect(clerkLocalization.signIn.emailCode.subtitle).toBe(`to continue to ${clerkAppName}`);
    expect(clerkLocalization.signUp.emailLink.subtitle).toBe(`to continue to ${clerkAppName}`);
  });
});
