import { describe, expect, it } from "vitest";

import { redactPii, subjectHash } from "@/lib/chat/anonymize";

describe("subjectHash", () => {
  it("is deterministic for the same user", () => {
    expect(subjectHash("user_123")).toBe(subjectHash("user_123"));
  });

  it("differs between users and never reveals the raw id", () => {
    const a = subjectHash("user_123");
    const b = subjectHash("user_456");
    expect(a).not.toBe(b);
    expect(a).not.toContain("user_123");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("redactPii", () => {
  it("strips email addresses", () => {
    expect(redactPii("reach me at jane.doe@example.com please")).toBe(
      "reach me at [email] please",
    );
  });

  it("strips phone numbers", () => {
    expect(redactPii("call +39 06 1234 5678 tomorrow")).toBe("call [phone] tomorrow");
  });

  it("strips long numeric identifiers", () => {
    const out = redactPii("my tax id is 12345678");
    expect(out).not.toContain("12345678");
    expect(out).toMatch(/\[(number|phone|card)\]/);
  });

  it("leaves ordinary text and small numbers untouched", () => {
    const text = "I rated it 5 out of 6 and felt great about question 12.";
    expect(redactPii(text)).toBe(text);
  });

  it("handles empty input", () => {
    expect(redactPii("")).toBe("");
  });
});
