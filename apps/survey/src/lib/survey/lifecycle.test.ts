import { describe, expect, it } from "vitest";

import {
  checkSurveyAction,
  type LifecycleDefinition,
  type LifecycleStatus,
  type SurveyAction,
} from "@/lib/survey/lifecycle";

const unlimited: LifecycleDefinition = { maxSubmissions: null };
const oneAttempt: LifecycleDefinition = { maxSubmissions: 1 };
const twoAttempts: LifecycleDefinition = { maxSubmissions: 2 };

const fresh: LifecycleStatus = { submittedCount: 0, hasActiveDraft: false };
const draftingOnFresh: LifecycleStatus = { submittedCount: 0, hasActiveDraft: true };
const oneSubmittedNoDraft: LifecycleStatus = { submittedCount: 1, hasActiveDraft: false };
const maxedOutWithDraft: LifecycleStatus = { submittedCount: 1, hasActiveDraft: true };
const allActions: SurveyAction[] = ["start-draft", "answer", "submit"];

describe("checkSurveyAction", () => {
  it("allows every action when the survey has no submission cap", () => {
    for (const action of allActions) {
      const decision = checkSurveyAction(unlimited, oneSubmittedNoDraft, action);
      expect(decision).toEqual({ allowed: true });
    }
  });

  it("allows every action while attempts remain", () => {
    for (const action of allActions) {
      const decision = checkSurveyAction(twoAttempts, oneSubmittedNoDraft, action);
      expect(decision).toEqual({ allowed: true });
    }
  });

  it("denies every action when attempts are exhausted and no draft is in flight", () => {
    for (const action of allActions) {
      const decision = checkSurveyAction(oneAttempt, oneSubmittedNoDraft, action);
      expect(decision).toMatchObject({
        allowed: false,
        reason: "out-of-attempts",
        message: "You have already used your final attempt for this survey.",
      });
    }
  });

  it("lets a maxed-out participant finish a lingering draft, but not submit it", () => {
    // The bug class flagged in the architecture review: a participant who has
    // exhausted attempts but still has an in-flight draft must be able to keep
    // typing into it, while submission must be blocked.
    expect(checkSurveyAction(oneAttempt, maxedOutWithDraft, "start-draft")).toEqual({
      allowed: true,
    });
    expect(checkSurveyAction(oneAttempt, maxedOutWithDraft, "answer")).toEqual({
      allowed: true,
    });
    expect(checkSurveyAction(oneAttempt, maxedOutWithDraft, "submit")).toMatchObject({
      allowed: false,
      reason: "out-of-attempts",
    });
  });

  it("treats a fresh participant as fully eligible", () => {
    for (const action of allActions) {
      expect(checkSurveyAction(oneAttempt, fresh, action)).toEqual({ allowed: true });
    }
  });

  it("allows answering a fresh draft even when maxSubmissions is exactly one", () => {
    // submittedCount === 0, hasActiveDraft === true: classic first-time flow.
    for (const action of allActions) {
      expect(checkSurveyAction(oneAttempt, draftingOnFresh, action)).toEqual({
        allowed: true,
      });
    }
  });
});
