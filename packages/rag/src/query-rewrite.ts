import type { SurveyChatContext } from "@ciaobang/chat-context";

function buildProfileSummary(context: SurveyChatContext): string {
  const parts: string[] = [];

  if (context.personality) {
    const p = context.personality;
    if (p.strongestScore) {
      parts.push(`Strongest personality trait: ${p.strongestScore.label} (${p.strongestScore.band})`);
    }
    if (p.lowestScore) {
      parts.push(`Lowest personality trait: ${p.lowestScore.label} (${p.lowestScore.band})`);
    }
    if (p.highestTraits.length > 0) {
      parts.push(`High traits: ${p.highestTraits.map((t) => t.label).join(", ")}`);
    }
  }

  if (context.valuesBeliefs) {
    const vb = context.valuesBeliefs;
    parts.push(`World view: ${vb.beliefs.primary.label} (${vb.beliefs.primary.band})`);
    if (vb.values.strongest) {
      parts.push(`Top value: ${vb.values.strongest.label}`);
    }
    if (vb.values.weakest) {
      parts.push(`Lowest value: ${vb.values.weakest.label}`);
    }
  }

  return parts.join(". ");
}

export function rewriteQuery(userQuery: string, surveyContext: SurveyChatContext): string {
  const profileSummary = buildProfileSummary(surveyContext);

  if (!profileSummary) {
    return userQuery;
  }

  return `${userQuery}\n\nUser psychological profile: ${profileSummary}`;
}
