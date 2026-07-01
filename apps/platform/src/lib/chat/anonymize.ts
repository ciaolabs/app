import { createHmac } from "node:crypto";

/**
 * Chat privacy: stored anonymously.
 *
 * Threads are keyed by a pseudonymous {@link subjectHash} (an HMAC of the auth
 * user id with a server secret) rather than a link to the identifiable account,
 * and message content is run through {@link redactPii} before it is written, so
 * the sensitive personal data users type is never stored in the clear.
 */

// A stable dev fallback keeps local/dev chat history working without config.
// Production must set CHAT_ANON_SECRET; rotating it makes previously stored
// chats unreachable (a deliberate "forget" lever).
const DEV_FALLBACK_SECRET = "ciao-dev-chat-anon-secret";

function getSecret(): string {
  return process.env.CHAT_ANON_SECRET?.trim() || DEV_FALLBACK_SECRET;
}

/**
 * Deterministic, non-reversible-without-the-secret pseudonym for a user. The
 * same user always maps to the same hash (so their own history is retrievable),
 * but the stored value reveals nothing about their identity on its own.
 */
export function subjectHash(userId: string): string {
  return createHmac("sha256", getSecret()).update(userId).digest("hex");
}

// Order matters: emails/IBANs/cards are matched before the generic long-number
// rule so they get their specific placeholder rather than a bare [number].
const PII_PATTERNS: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  // Email addresses
  { pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, replacement: "[email]" },
  // IBAN (e.g. IT60X0542811101000000123456)
  { pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi, replacement: "[iban]" },
  // Credit-card-like groups of 13–19 digits (spaces/dashes allowed)
  { pattern: /\b(?:\d[ -]?){13,19}\b/g, replacement: "[card]" },
  // IPv4 addresses
  { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: "[ip]" },
  // Phone numbers: optional +, then 7+ digits with spaces/dashes/parens/dots
  { pattern: /(?<!\w)\+?\d[\d\s().-]{6,}\d(?!\w)/g, replacement: "[phone]" },
  // Any remaining run of 7+ digits (ids, SSNs, tax codes, ...)
  { pattern: /\b\d{7,}\b/g, replacement: "[number]" },
];

/**
 * Strip the personal data that can be reliably detected (emails, phone numbers,
 * card/IBAN/IP/long numeric ids) from free text before it is stored. Names and
 * addresses cannot be caught by pattern matching and are out of scope.
 */
export function redactPii(text: string): string {
  if (!text) {
    return text;
  }

  return PII_PATTERNS.reduce(
    (result, { pattern, replacement }) => result.replace(pattern, replacement),
    text,
  );
}
