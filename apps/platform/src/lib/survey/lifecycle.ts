import { logger } from "@/lib/logger";

export type SurveyAction = "start-draft" | "answer" | "submit";

export type LifecycleDefinition = { maxSubmissions: number | null };
export type LifecycleStatus = { submittedCount: number; hasActiveDraft: boolean };

export type LifecycleDecision =
  | { allowed: true }
  | { allowed: false; reason: "out-of-attempts"; message: string };

const OUT_OF_ATTEMPTS_MESSAGE = "You have already used your final attempt for this survey.";

export function checkSurveyAction(
  definition: LifecycleDefinition,
  status: LifecycleStatus,
  action: SurveyAction,
): LifecycleDecision {
  if (definition.maxSubmissions === null) {
    logger.debug({ action }, "Lifecycle check: unlimited attempts, allowing");
    return { allowed: true };
  }

  const hasAttemptsLeft = status.submittedCount < definition.maxSubmissions;

  logger.debug(
    { action, submittedCount: status.submittedCount, maxSubmissions: definition.maxSubmissions, hasActiveDraft: status.hasActiveDraft, hasAttemptsLeft },
    "Lifecycle check",
  );

  switch (action) {
    case "start-draft":
    case "answer":
      // Drafting and answering are allowed if there's a remaining attempt OR
      // the participant is finishing an in-flight draft from a prior attempt.
      if (hasAttemptsLeft || status.hasActiveDraft) {
        return { allowed: true };
      }
      return { allowed: false, reason: "out-of-attempts", message: OUT_OF_ATTEMPTS_MESSAGE };
    case "submit":
      // Submission consumes an attempt; only allowed when one remains.
      if (hasAttemptsLeft) {
        return { allowed: true };
      }
      return { allowed: false, reason: "out-of-attempts", message: OUT_OF_ATTEMPTS_MESSAGE };
  }
}
