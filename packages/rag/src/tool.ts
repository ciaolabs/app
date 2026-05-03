import { tool } from "ai";
import { z } from "zod";
import type { Sql } from "@ciaobang/db";
import type { SurveyChatContext } from "@ciaobang/chat-context";
import { embedText } from "./embed";
import { retrieveCandidates } from "./retrieve";
import { mmrRerank } from "./rerank";
import { rewriteQuery } from "./query-rewrite";

export function makeSearchDocsTool(
  surveyContext: SurveyChatContext,
  sql: Sql,
  googleApiKey: string,
) {
  return tool({
    description:
      "Search the survey documentation for explanations of personality traits, values, beliefs, and psychological concepts. Use this when the user asks about what a score means, how a dimension is defined, or wants to understand the science behind their results.",
    inputSchema: z.object({
      query: z.string().describe("The search query based on the user's question"),
    }),
    execute: async ({ query }: { query: string }) => {
      const rewrittenQuery = rewriteQuery(query, surveyContext);
      const queryEmbedding = await embedText(rewrittenQuery, googleApiKey);
      const candidates = await retrieveCandidates(queryEmbedding, sql);
      const chunks = mmrRerank(candidates, 5);
      return chunks.map((chunk) => ({
        title: chunk.title,
        content: chunk.content,
        relevance: Math.round(chunk.similarity * 100) / 100,
      }));
    },
  });
}
