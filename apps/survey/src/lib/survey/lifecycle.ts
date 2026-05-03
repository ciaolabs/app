type LifecycleDefinition = { maxSubmissions: number | null };
type LifecycleStatus = { submittedCount: number; hasActiveDraft: boolean };

export function canStartDraft(definition: LifecycleDefinition, status: LifecycleStatus): boolean {
  if (definition.maxSubmissions === null) return true;
  if (status.submittedCount < definition.maxSubmissions) return true;
  return status.hasActiveDraft;
}

export function canAnswer(definition: LifecycleDefinition, status: LifecycleStatus): boolean {
  return canStartDraft(definition, status);
}

export function canSubmit(
  definition: LifecycleDefinition,
  status: Pick<LifecycleStatus, "submittedCount">,
): boolean {
  if (definition.maxSubmissions === null) return true;
  return status.submittedCount < definition.maxSubmissions;
}
