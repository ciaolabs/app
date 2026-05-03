import type { DocChunk } from "@ciaobang/chat-context";
import type { RawChunk } from "./retrieve";

const MMR_LAMBDA = 0.7;

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i]! * b[i]!;
  return sum;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const normA = Math.sqrt(dotProduct(a, a));
  const normB = Math.sqrt(dotProduct(b, b));
  if (normA === 0 || normB === 0) return 0;
  return dotProduct(a, b) / (normA * normB);
}

export function mmrRerank(candidates: RawChunk[], topK: number = 5): DocChunk[] {
  const selected: RawChunk[] = [];
  const remaining = [...candidates];

  while (selected.length < topK && remaining.length > 0) {
    let bestScore = -Infinity;
    let bestIndex = 0;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i]!;
      const relevance = candidate.similarity;

      const maxSimilarityToSelected =
        selected.length === 0
          ? 0
          : Math.max(...selected.map((s) => cosineSimilarity(candidate.embedding, s.embedding)));

      const mmrScore = MMR_LAMBDA * relevance - (1 - MMR_LAMBDA) * maxSimilarityToSelected;

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = i;
      }
    }

    selected.push(remaining[bestIndex]!);
    remaining.splice(bestIndex, 1);
  }

  return selected.map(({ id, docId, title, content, chunkIndex, similarity }) => ({
    id,
    docId,
    title,
    content,
    chunkIndex,
    similarity,
  }));
}
